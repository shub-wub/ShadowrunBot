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
    ModalSubmitInteraction,
} from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import Match from "#schemas/match";
import { Field, IGuild, IPlayer, IQueue, IQueuePlayer } from "../../types";
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

        var queueCount = Number(updatedQueuePlayers.length);
        var addUnreadyEmoji = false;
        if (queueCount >= 8) addUnreadyEmoji = true;
        var queuePlayers = '';
        for (let i = 0; i < updatedQueuePlayers.length; i++) {
            if(updatedQueuePlayers[i].matchMessageId) continue;
            if(!queryResults[3]) return;
            var player = await Player.findOne<IPlayer>({ discordId: updatedQueuePlayers[i].discordId });
            if(!player) return;
            var emoji = getRankEmoji(player, queryResults[3]);

            if(addUnreadyEmoji && !updatedQueuePlayers[i].ready) { // player joined the queue and there are 8 players
                queuePlayers += `:x:<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;

            } else if (!addUnreadyEmoji && !updatedQueuePlayers[i].ready) { // player joined the queue and there are NOT 8 players
                queuePlayers += `<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;

            } else if (addUnreadyEmoji && updatedQueuePlayers[i].ready) { // player readied up
                queuePlayers += `:white_check_mark:<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating}\n`;
            }
        }
        updateQueueEmbed(interaction, queueEmbed, queuePlayers, queueCount, !addUnreadyEmoji);
    }).catch(async error => {
        mongoError(error);
        await interaction.reply({
            content: `There was an error getting data from the database for user: ${userId}`,
            ephemeral: true
        });
        return;
    });
}

export const createMatchEmbed = (rnaPlayers: IPlayer[], lineagePlayers: IPlayer[], guildRecord: IGuild): any => {
    var rna = "";
    var lineage = "";
    var rnaTotal = 0;
    var lineageTotal = 0;
    var fields: Field[] = [];
    for (let i = 0; i < rnaPlayers.length; i++) {
        var emoji = getRankEmoji(rnaPlayers[i], guildRecord);
        rnaTotal += rnaPlayers[i].rating;
        rna += `<@${rnaPlayers[i].discordId}> ${emoji}${rnaPlayers[i].rating}\n`;
    }
    for (let i = 0; i < lineagePlayers.length; i++) {
        var emoji = getRankEmoji(lineagePlayers[i], guildRecord);
        lineageTotal += lineagePlayers[i].rating;
        lineage += `<@${lineagePlayers[i].discordId}> ${emoji}${lineagePlayers[i].rating}\n`;
    }
    fields.push({name: `RNA(${rnaTotal})`, value: rna, inline: true});
    fields.push({name: `Lineage(${lineageTotal})`, value: lineage, inline: true});
    const embed: any = new EmbedBuilder()
        .setTitle(`RNA(${rnaTotal}) - LINEAGE(${lineageTotal})`)
        .setColor(getThemeColor("embed"))
        .addFields(fields);
    return embed;
};


export const createMatchButtonRow = (): ActionRowBuilder<ButtonBuilder> => {
	const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
	const rnaGame1Button = new ButtonBuilder()
		.setCustomId("scoregame1")
		.setLabel("Score Game 1")
		.setStyle(ButtonStyle.Primary);
    const rnaGame2Button = new ButtonBuilder()
		.setCustomId("scoregame2")
		.setLabel("Score Game 2")
		.setStyle(ButtonStyle.Primary);
    const rnaGame3Button = new ButtonBuilder()
		.setCustomId("scoregame3")
		.setLabel("Score Game 3")
		.setStyle(ButtonStyle.Primary);
	buttonRow.addComponents(rnaGame1Button, rnaGame2Button, rnaGame3Button);
	return buttonRow;
};

export const createMatch = async (interaction: ButtonInteraction<CacheType>, client: Client, queuePlayers: IQueuePlayer[]): Promise<void> => {
    var players: IPlayer[] = [];
    for (let i = 0; i < queuePlayers.length; i++) {
        var player = await Player.findOne<IPlayer>({ discordId: queuePlayers[i].discordId });
        if(!player) return;
        players.push(player);
    }

    var guildRecord = await Guild.findOne<IGuild>({
		guildId: interaction.guildId,
	});
	if (guildRecord) {
        var teams = generateTeams(players);
        const initialEmbed = createMatchEmbed(teams[1], teams[0], guildRecord);
        const buttonRow = createMatchButtonRow();

		var channel = await client.channels.fetch(
			guildRecord.matchChannelId
		);
		var message = await (channel as TextChannel).send({
			embeds: [initialEmbed],
			components: [buttonRow],
		});

		try {
			await new Match({
				messageId: message.id,
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
	} else {
		await interaction.reply({
			content: `There was no guild record found. Try using /srinitialize first.`,
			ephemeral: true,
		});
	}
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