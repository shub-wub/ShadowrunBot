import { getThemeColor, mongoError } from "#utilities";
import {
	CacheType,
	ButtonInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageActionRowComponentBuilder,
    Client,
    TextChannel,
} from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import Match from "#schemas/match";
import Map from "#schemas/map";
import { Field, IGuild, IPlayer, IQueue, IQueuePlayer, IMap } from "../../types";
import { MongooseError } from "mongoose";
import { generateTeams, getRankEmoji } from "#operations";

export const processQueue = (interaction: ButtonInteraction, client: Client, playerReady = false, overridePlayer?: string): void => {
    var userId = overridePlayer ? overridePlayer : interaction.user.id;
	const receivedEmbed = interaction.message.embeds[0];
	const queueEmbed = EmbedBuilder.from(receivedEmbed);
    const playerQuery = Player.findOne<IPlayer>({ discordId: userId });
    const queueUserQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { discordId: userId}, { matchMessageId: { $exists: false } }]);
    const queueAllPlayers = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { matchMessageId: { $exists: false } }]);
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const queueQuery = Queue.findOne<IQueue>({ messageId: interaction.message.id });

    Promise.all([playerQuery, queueUserQuery, queueAllPlayers, guildQuery, queueQuery])
        .then(async (queryResults: [IPlayer | null, IQueuePlayer[], IQueuePlayer[], IGuild | null, IQueue | null]) => {
            if(!queryResults[3]) return;
            if (!queryResults[0]) {
                await interaction.reply({
                    content: `You must first do /statregister before you can play ranked.`,
                    ephemeral: true
                });
                return;
            }
            /*if (queryResults[1].length > 0) {
                await interaction.reply({
                    content: `You have already been added to the queue. You can either wait for a match or remove yourself.`,
                    ephemeral: true
                });
                return;
            }*/
            if (!queryResults[4]) return;
            if (!(queryResults[0].rating > queryResults[4].rankMin && queryResults[0].rating < queryResults[4].rankMax)) {
                await interaction.reply({
                    content: `Your rating: ${queryResults[0].rating} must be between ${queryResults[4].rankMin} and ${queryResults[4].rankMax}`,
                    ephemeral: true
                });
                return;
            }

            // if the player is ready we want to save to the DB
            if(playerReady) {
                queryResults[1][0].ready = true;
                await queryResults[1][0].save().catch(console.error);
            }
            var updatedQueuePlayers = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { matchMessageId: { $exists: false } }]);

            var playersReady = updatedQueuePlayers.filter(p => p.ready);

            // check if there are 8 players ready
            if(playersReady.length == 8) {
                await createMatch(interaction, client, playersReady);
                updatedQueuePlayers = updatedQueuePlayers.filter(p => !p.ready);
                //updatedQueuePlayers = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { matchMessageId: { $exists: false } }]);
            }

            // if playerReady = false then they joined the queue
            if (!playerReady) {
                var queueRecord = null;
                try {
                    queueRecord = await new QueuePlayer({
                        discordId: userId,
                        messageId: interaction.message.id,
                        //matchMessageId: "",
                        ready: false,
                    }).save();
                } catch (error) {
                    mongoError(error as MongooseError);
                    await interaction.reply({
                        content: `There was an error adding the player to the queue in the database.`,
                        ephemeral: true,
                    });
                    return;
                }
                updatedQueuePlayers.push(queueRecord);
            }

            rebuildQueue(interaction, queueEmbed, updatedQueuePlayers, queryResults[3]);
        }).catch(async error => {
            mongoError(error);
            await interaction.reply({
                content: `There was an error getting data from the database for user: ${userId}`,
                ephemeral: true
            });
            return;
        });
}

export const removeUserFromQueue = async (interaction: ButtonInteraction, client: Client): Promise<void> => {
    const queueUserQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { discordId: interaction.user.id}, { matchMessageId: { $exists: false } }]);
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);

    Promise.all([queueUserQuery, guildQuery])
    .then(async (queryResults: [IQueuePlayer[], IGuild | null]) => {
        if(!queryResults[1]) return;
        if (queryResults[0].length == 0) {
            await interaction.reply({
                content: `You are not in the queue so you cannot remove yourself.`,
                ephemeral: true
            });
            return;
        }
    
        try {
            await QueuePlayer.deleteOne({ _id: queryResults[0][0]._id });
            var updatedQueue = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { matchMessageId: { $exists: false } }]);
        } catch(error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error deleting the player from the queue in the database.`,
                ephemeral: true
            });
            return;
        }
    
        rebuildQueue(interaction, queueEmbed, updatedQueue, queryResults[1]);
    }).catch(async error => {
        mongoError(error);
        await interaction.reply({
            content: `There was an error getting data from the database.`,
            ephemeral: true
        });
        return;
    });
}

export const createMatchEmbed = (team1Players: IPlayer[], team2Players: IPlayer[], guildRecord: IGuild, maps: IMap[]): any => {
    var team1 = "";
    var team2 = "";
    var team1Total = 0;
    var team2Total = 0;
    var fields: Field[] = [];
    for (let i = 0; i < team1Players.length; i++) {
        var emoji = getRankEmoji(team1Players[i], guildRecord);
        team1Total += team1Players[i].rating;
        team1 += `<@${team1Players[i].discordId}> ${emoji}${team1Players[i].rating}\n`;
    }
    for (let i = 0; i < team2Players.length; i++) {
        var emoji = getRankEmoji(team2Players[i], guildRecord);
        team2Total += team2Players[i].rating;
        team2 += `<@${team2Players[i].discordId}> ${emoji}${team2Players[i].rating}\n`;
    }
    fields.push({name: `Maps`, value: `${maps[0].name}\n${maps[1].name}\n${maps[2].name}`, inline: false});
    fields.push({name: `Team 1(${team1Total})`, value: team1, inline: true});
    fields.push({name: `Team 2(${team2Total})`, value: team2, inline: true});
    var randomTeam = Math.floor(Math.random() * 2) + 1;
    const embed: any = new EmbedBuilder()
        .setTitle(`Team ${randomTeam} picks server and side first`)
        .setColor(getThemeColor("embed"))
        .addFields(fields);
    return embed;
};


export const createMatchButtonRow1 = (): ActionRowBuilder<ButtonBuilder> => {
	const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
	const team1Game1Button = new ButtonBuilder()
		.setCustomId("scoret1g1")
		.setLabel("Score T1G1")
		.setStyle(ButtonStyle.Primary);
    const team1Game2Button = new ButtonBuilder()
		.setCustomId("scoret1g2")
		.setLabel("Score T1G2")
        .setDisabled(true)
		.setStyle(ButtonStyle.Primary);
    const team1Game3Button = new ButtonBuilder()
		.setCustomId("scoret1g3")
		.setLabel("Score T1G3")
        .setDisabled(true)
		.setStyle(ButtonStyle.Primary);
	buttonRow.addComponents(team1Game1Button, team1Game2Button, team1Game3Button);
	return buttonRow;
};
export const createMatchButtonRow2 = (): ActionRowBuilder<ButtonBuilder> => {
	const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
    const team2Game1Button = new ButtonBuilder()
        .setCustomId("scoret2g1")
        .setLabel("Score T2G1")
        .setStyle(ButtonStyle.Danger);
    const team2Game2Button = new ButtonBuilder()
        .setCustomId("scoret2g2")
        .setLabel("Score T2G2")
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger);
    const team2Game3Button = new ButtonBuilder()
        .setCustomId("scoret2g3")
        .setLabel("Score T2G3")
        .setDisabled(true)
        .setStyle(ButtonStyle.Danger);
    buttonRow.addComponents(team2Game1Button, team2Game2Button, team2Game3Button);
	return buttonRow;
};

export const createMatch = async (interaction: ButtonInteraction<CacheType>, client: Client, queuePlayers: IQueuePlayer[]): Promise<void> => {
    const playersQuery = Player.find({ discordId: { $in: queuePlayers.map(qp => qp.discordId) } });
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const mapQuery = Map.find<IMap>();

    Promise.all([playersQuery, guildQuery, mapQuery])
    .then(async (queryResults: [IPlayer[], IGuild | null, IMap[]]) => {
        if (queryResults[0].length !== queuePlayers.length) {
            console.log("Not all players were found.")
            return;
        }
        if (!queryResults[1]) {
            await interaction.reply({
                content: `There was no guild record found. Try using /srinitialize first.`,
                ephemeral: true,
            });
            return;
        }

        // Generate 3 random indices without repetition
        var maps: IMap[] = [];
        const indices = new Set<number>();
        while (indices.size < 3) {
            const index = Math.floor(Math.random() * queryResults[2].length);
            if (!indices.has(index))
                indices.add(index);
        }

        // Add the randomly selected maps to the 'maps' array
        for (const index of indices)
            maps.push(queryResults[2][index]);


        var teams = generateTeams(queryResults[0]);
        const initialEmbed = createMatchEmbed(teams[1], teams[0], queryResults[1], maps);
        const buttonRow1 = createMatchButtonRow1();
        const buttonRow2 = createMatchButtonRow2();

        var channel = await client.channels.fetch(
            queryResults[1].matchChannelId
        );
        var message = await (channel as TextChannel).send({
            embeds: [initialEmbed],
            components: [buttonRow1, buttonRow2],
        });

        try {
            await new Match({
                messageId: message.id,
                map1: maps[0].name,
                map2: maps[1].name,
                map3: maps[2].name
            }).save();
            queuePlayers.forEach(async p => {
                p.matchMessageId = message.id;
                await p.save();
            });
        } catch (error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error adding the match to the database.`,
                ephemeral: true,
            });
            return;
        }
    }).catch(async error => {
        mongoError(error);
        await interaction.reply({
            content: `There was an error getting data from the database for the match.`,
            ephemeral: true
        });
        return;
    });
}

export const updateQueueEmbed = async (interaction: ButtonInteraction<CacheType>, queueEmbed: EmbedBuilder, queuePlayers: string, queueCount: number, disableReadyButton: boolean): Promise<void> => {
    if(!queuePlayers) queuePlayers = "\u200b";
    queueEmbed.setFields([{
            name: `Players in Queue - ${queueCount}`,
            value: queuePlayers,
            inline: true
        }
    ]);

    const activeButtonRow1 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents([
            new ButtonBuilder()
                .setCustomId('queue')
                .setLabel('Queue')
                .setStyle(ButtonStyle.Success)
                .setDisabled(!disableReadyButton),
            new ButtonBuilder()
                .setCustomId('readyup')
                .setLabel('Ready Up')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disableReadyButton),
            new ButtonBuilder()
                .setCustomId('removeQueue')
                .setLabel('Remove Me')
                .setStyle(ButtonStyle.Danger),
            ]);
    const activeButtonRow2 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('readyUpPlayer')
                    .setLabel('Ready Up Player')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('queuePlayer')
                    .setLabel('Queue Player')
                    .setStyle(ButtonStyle.Danger),
                ]);
    await interaction.message.edit({
        embeds: [queueEmbed],
        components: [activeButtonRow1, activeButtonRow2]
    });
    await interaction.deferUpdate();
}

export const rebuildQueue = async (interaction: ButtonInteraction<CacheType>, queueEmbed: EmbedBuilder, updatedQueuePlayers: IQueuePlayer[], guild: IGuild): Promise<void> => {
    var queueCount = Number(updatedQueuePlayers.length);
    var addUnreadyEmoji = false;
    if (queueCount >= 8) addUnreadyEmoji = true;
    var queuePlayers = '';
    for (let i = 0; i < updatedQueuePlayers.length; i++) {
        if(updatedQueuePlayers[i].matchMessageId) continue;
        var player = await Player.findOne<IPlayer>({ discordId: updatedQueuePlayers[i].discordId });
        if(!player) return;
        var emoji = getRankEmoji(player, guild);

        if(addUnreadyEmoji && !updatedQueuePlayers[i].ready) { // player joined the queue and there are 8 players
            queuePlayers += `:x:<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;

        } else if (!addUnreadyEmoji && !updatedQueuePlayers[i].ready) { // player joined the queue and there are NOT 8 players
            queuePlayers += `<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;

        } else if (addUnreadyEmoji && updatedQueuePlayers[i].ready) { // player readied up
            queuePlayers += `:white_check_mark:<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;
        }
    }
    updateQueueEmbed(interaction, queueEmbed, queuePlayers, queueCount, !addUnreadyEmoji);
}