import { getThemeColor, mongoError } from "#utilities";
import { CacheType, ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder, Client, TextChannel, Message, User, GuildMember, PermissionsBitField, } from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import Match from "#schemas/match";
import Map from "#schemas/map";
import { Field, IGuild, IPlayer, IQueue, IQueuePlayer, IMap } from "../../types";
import { MongooseError } from "mongoose";
import { generateTeams, getRankEmoji } from "#operations";

export const processQueue = async (interaction: ButtonInteraction, client: Client, overridePlayer?: string): Promise<void> => {
    var userId = overridePlayer ? overridePlayer : interaction.user.id;

    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);
    const playerQuery = Player.findOne<IPlayer>({ discordId: userId });
    const queueUserQuery = QueuePlayer.findOne<IQueuePlayer>().and([{ discordId: userId }]);
    // TODO check if they are already in a match for this queue. 
    // I think we will have to set a bool on the Iqueueplayer record for if the match is finished to check here
    //const inAMatchQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { discordId: userId}, { matchMessageId: { $exists: false } }]);
    const queueAllPlayers = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id }, { matchMessageId: { $exists: false } }]);
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const queueQuery = Queue.findOne<IQueue>({ messageId: interaction.message.id });

    await Promise.all([playerQuery, queueUserQuery, queueAllPlayers, guildQuery, queueQuery])
        .then(async (queryResults: [IPlayer | null, IQueuePlayer | null, IQueuePlayer[], IGuild | null, IQueue | null]) => {

            var player = queryResults[0];
            var queueUser = queryResults[1];
            var queuePlayers = queryResults[2];
            var guild = queryResults[3];
            var queue = queryResults[4];

            if (player?.isBanned) {
                await interaction.reply({
                    content: `You have been banned from ranked until you appeal or the ban time is up.`,
                    ephemeral: true
                });
                return;
            }

            if (!guild) return;
            if (!player) {
                await interaction.reply({
                    content: `You must first do /statregister before you can play ranked.`,
                    ephemeral: true
                });
                return;
            }

            if (queueUser != null && queueUser.matchMessageId == null) {
                await interaction.reply({
                    content: `You have already been added to the queue. You can either wait for a match or remove yourself.`,
                    ephemeral: true
                });
                return;
            }

            /*if (queueUser && queueUser?.matchMessageId != null) {
                await interaction.reply({
                    content: `You have an unscored match. You must wait until the match is scored until you can queue or ready up again.`,
                    ephemeral: true
                });
                return;
            }*/

            if (!queue) return;
            if (!(player.rating >= queue.rankMin && player.rating <= queue.rankMax)) {
                await interaction.reply({
                    content: `Your rating: ${player.rating} must be between ${queue.rankMin} and ${queue.rankMax}`,
                    ephemeral: true
                });
                return;
            }
            if (!queueUser) {queuePlayers
                queueUser = new QueuePlayer({
                    discordId: userId,
                    messageId: interaction.message.id,
                    ready: false,
                })
            }

            var queueRecord = null;
            var currentTime = new Date();
            try {
                queueRecord = await new QueuePlayer({
                    discordId: userId,
                    messageId: interaction.message.id,
                    queuePosition: null,
                    queueTime: currentTime
                }).save();
            } catch (error) {
                mongoError(error as MongooseError);
                console.log(`There was an error adding the player to the queue in the database.`)
                return;
            }
            queuePlayers.push(queueRecord);
            await updateQueuePositions(queuePlayers);

            if (queuePlayers.length >= 8) {
                for (const uqp of queuePlayers) {
                    if (uqp.queuePosition <= 8) {
                        var user = client.users.cache.get(uqp.discordId);
                        if (!user) continue;
                        await user.send(`Hello, your match is ready! Please join the players in the ranked voice channel within 5 minutes.`).catch((e: any) => { });
                    }
                }
            }
            rebuildQueue(interaction, queueEmbed, interaction.message, queuePlayers, guild, queue, false);
        }).catch(async error => {
            mongoError(error);
            console.log(`There was an error getting data from the database for user: ${userId}`)
            return;
        });
}

export const launchMatch = async (interaction: ButtonInteraction, client: Client) => {
    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const queueQuery = Queue.findOne<IQueue>({ messageId: interaction.message.id });
    var queuePlayersTop8Query = QueuePlayer.find<IQueuePlayer>().and([
        { messageId: interaction.message.id }, 
        { matchMessageId: { $exists: false } },
        { queuePosition: { $lte: 8 } }
    ]);

    await Promise.all([queuePlayersTop8Query, guildQuery, queueQuery])
        .then(async (queryResults: [IQueuePlayer[], IGuild | null, IQueue | null]) => {
            var queuePlayersTop8 = queryResults[0];
            var guild = queryResults[1];
            var queue = queryResults[2];

            if (!guild) return;

            if (queuePlayersTop8.length >= 8) {
                await createMatch(interaction, client, queuePlayersTop8);

                // get the queuePlayers again where matchMessageId is null so we remove the match players from the queue.
                var updatedQueuePlayers = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id }, { matchMessageId: { $exists: false } }]);
                await updateQueuePositions(updatedQueuePlayers);

                rebuildQueue(interaction, queueEmbed, interaction.message, updatedQueuePlayers, guild, queue as IQueue, false);
            } else {
                await interaction.reply({
                    content: `There are not yet 8 players in the queue for you to launch the match.`,
                    ephemeral: true
                });
            }
        }).catch(async error => {
            mongoError(error);
            console.log(`There was an error launching the match.` + error)
            return;
        });
}

export const removeUserFromQueue = async (interaction: ButtonInteraction, overridePlayer?: string): Promise<void> => {
    var userId = overridePlayer ? overridePlayer : interaction.user.id;
    const queueUserQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id }, { discordId: userId }, { matchMessageId: { $exists: false } }]);
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);
    const queueQuery = Queue.findOne<IQueue>({ messageId: interaction.message.id });

    await Promise.all([queueUserQuery, guildQuery, queueQuery])
        .then(async (queryResults: [IQueuePlayer[], IGuild | null, IQueue | null]) => {
            var queue = queryResults[2];
            if (!queryResults[1]) return;
            if (queryResults[0].length == 0) {
                await interaction.reply({
                    content: `You are not in the queue so you cannot remove yourself.`,
                    ephemeral: true
                });
                return;
            }

            try {
                await QueuePlayer.deleteOne({ _id: queryResults[0][0]._id });
                var updatedQueue = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id }, { matchMessageId: { $exists: false } }]);
            } catch (error) {
                mongoError(error as MongooseError);
                console.log(`There was an error deleting the player from the queue in the database.`)
                return;
            }

            rebuildQueue(interaction, queueEmbed, interaction.message, updatedQueue, queryResults[1], queue as IQueue, false);
        }).catch(async error => {
            mongoError(error);
            console.log(`There was an error getting data from the database.`)
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
    fields.push({ name: `Maps`, value: `${maps[0].name}\n${maps[1].name}\n${maps[2].name}`, inline: false });
    fields.push({ name: `Team 1(${team1Total})`, value: team1, inline: true });
    fields.push({ name: `Team 2(${team2Total})`, value: team2, inline: true });
    var randomTeam = Math.floor(Math.random() * 2) + 1;
    const embed: any = new EmbedBuilder()
        .setTitle(`Team ${randomTeam} picks server and side first`)
        .setColor(getThemeColor("embed"))
        .addFields(fields);
    return embed;
};

export const createMatchButtonRow1 = (g1: boolean, g2: boolean, g3: boolean): ActionRowBuilder<ButtonBuilder> => {
    const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
    const team1Game1Button = new ButtonBuilder()
        .setCustomId("scoret1g1")
        .setLabel("Score T1G1")
        .setDisabled(g1)
        .setStyle(ButtonStyle.Primary);
    const team1Game2Button = new ButtonBuilder()
        .setCustomId("scoret1g2")
        .setLabel("Score T1G2")
        .setDisabled(g2)
        .setStyle(ButtonStyle.Primary);
    const team1Game3Button = new ButtonBuilder()
        .setCustomId("scoret1g3")
        .setLabel("Score T1G3")
        .setDisabled(g3)
        .setStyle(ButtonStyle.Primary);
    buttonRow.addComponents(team1Game1Button, team1Game2Button, team1Game3Button);
    return buttonRow;
};
export const createMatchButtonRow2 = (g1: boolean, g2: boolean, g3: boolean): ActionRowBuilder<ButtonBuilder> => {
    const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
    const team2Game1Button = new ButtonBuilder()
        .setCustomId("scoret2g1")
        .setLabel("Score T2G1")
        .setDisabled(g1)
        .setStyle(ButtonStyle.Danger);
    const team2Game2Button = new ButtonBuilder()
        .setCustomId("scoret2g2")
        .setLabel("Score T2G2")
        .setDisabled(g2)
        .setStyle(ButtonStyle.Danger);
    const team2Game3Button = new ButtonBuilder()
        .setCustomId("scoret2g3")
        .setLabel("Score T2G3")
        .setDisabled(g3)
        .setStyle(ButtonStyle.Danger);
    buttonRow.addComponents(team2Game1Button, team2Game2Button, team2Game3Button);
    return buttonRow;
};

export const createMatch = async (interaction: ButtonInteraction<CacheType>, client: Client, queuePlayers: IQueuePlayer[]): Promise<void> => {
    const playersQuery = Player.find({ discordId: { $in: queuePlayers.map(qp => qp.discordId) } });
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const mapQuery = Map.find<IMap>();
    await Promise.all([playersQuery, guildQuery, mapQuery]).then(async (queryResults: [IPlayer[], IGuild | null, IMap[]]) => {
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
        const buttonRow1 = createMatchButtonRow1(false, true, true);
        const buttonRow2 = createMatchButtonRow2(false, true, true);

        var channel = await client.channels.fetch(
            queryResults[1].matchChannelId
        );

        var message = await (channel as TextChannel).send({
            embeds: [initialEmbed],
            components: [buttonRow1, buttonRow2],
        });

        try {
            new Match({
                messageId: message.id,
                queueId: interaction.message.id,
                map1: maps[0].name,
                map2: maps[1].name,
                map3: maps[2].name,
                team1ReportedT1G1Rounds: 0,
                team1ReportedT1G2Rounds: 0,
                team1ReportedT1G3Rounds: 0,
                team1ReportedT2G1Rounds: 0,
                team1ReportedT2G2Rounds: 0,
                team1ReportedT2G3Rounds: 0,
                team2ReportedT1G1Rounds: 0,
                team2ReportedT1G2Rounds: 0,
                team2ReportedT1G3Rounds: 0,
                team2ReportedT2G1Rounds: 0,
                team2ReportedT2G2Rounds: 0,
                team2ReportedT2G3Rounds: 0
            }).save();

            await Promise.all(queuePlayers.map(async qp => {
                qp.matchMessageId = message.id;
                const team1Player = teams[1].find(p => p.discordId == qp.discordId);
                qp.team = team1Player ? 1 : 2;
                try {
                    return qp.save();
                } catch (error) {
                    console.error("Error saving queue player:", error);
                }
            }));
        } catch (error) {
            mongoError(error as MongooseError);
            console.log(`There was an error adding the match to the database.`)
            return;
        }
    }).catch(async error => {
        mongoError(error);
        console.log(`There was an error getting data from the database for the match.`)
        return;
    });
}

export const updateQueueEmbed = async (interaction: ButtonInteraction<CacheType>, queueEmbed: EmbedBuilder, queueEmbedMessage: Message<boolean>, queuePlayers: string, queueCount: number, isInLaunchState: boolean, deferred: boolean): Promise<void> => {
    if (!queuePlayers) queuePlayers = "\u200b";
    var currentTime = new Date();
    const minutesToReady = 5;
    const currentTimePlusMinutesToReady = new Date(currentTime.getTime() + minutesToReady * 60000);
    const unixTimestamp = Math.floor(currentTimePlusMinutesToReady.getTime() / 1000);
    if (isInLaunchState) {
        queueEmbed.setFields([{
            name: `Launch Timer`,
            value: `Ending <t:${unixTimestamp}:R>`,
            inline: false
        }, {
            name: `Players in Queue - ${queueCount}`,
            value: queuePlayers,
            inline: false
        }
        ]);
    } else {
        queueEmbed.setFields([{
            name: `Players in Queue - ${queueCount}`,
            value: queuePlayers,
            inline: false
        }
        ]);
    }

    const activeButtonRow1 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents([
            new ButtonBuilder()
                .setCustomId('queue')
                .setLabel('Queue')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('removeQueue')
                .setLabel('Remove Me')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('removePlayer')
                .setLabel('Remove Player')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('launchMatch')
                .setLabel('Launch Match')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!isInLaunchState),
        ]);
    const activeButtonRow2 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents([
            new ButtonBuilder()
                .setCustomId('queuePlayer')
                .setLabel('Queue Player')
                .setStyle(ButtonStyle.Danger),
        ]);
    await queueEmbedMessage.edit({
        embeds: [queueEmbed],
        components: [activeButtonRow1/*, activeButtonRow2*/] 
    });
    if (!deferred) {
        deferred = true;
        await interaction.deferUpdate().catch(error => {
            console.log(error);
        });
    }
}

export const rebuildQueue = async (interaction: ButtonInteraction<CacheType>, queueEmbed: EmbedBuilder, queueEmbedMessage: Message<boolean>, updatedQueuePlayers: IQueuePlayer[], guild: IGuild, queue: IQueue, deferred: boolean): Promise<void> => {
    var queueCount = Number(updatedQueuePlayers.length);
    var isInLaunchState = false;
    var hidePlayerNames = queue.hidePlayerNames;
    
    if (queueCount >= 8) {
        isInLaunchState = true;
    }

    var queuePlayers = '';
    if(queueCount > 0) {
        for (let i = 0; i < updatedQueuePlayers.length; i++) {
            if (updatedQueuePlayers[i].matchMessageId) continue;
            var player = await Player.findOne<IPlayer>({ discordId: updatedQueuePlayers[i].discordId });
            if (!player) return;
            var emoji = getRankEmoji(player, guild);
            const unixTimestamp = Math.floor(updatedQueuePlayers[i].queueTime.getTime() / 1000);
            if (hidePlayerNames) {
                queuePlayers += `Player ${i + 1} ${emoji} in queue since <t:${unixTimestamp}:R>\n`;
            }
            else {
                queuePlayers += `<@${updatedQueuePlayers[i].discordId}> ${emoji}${player.rating} in queue since <t:${unixTimestamp}:R>\n`;
            }
        }
    }
    updateQueueEmbed(interaction, queueEmbed, queueEmbedMessage, queuePlayers, queueCount, isInLaunchState, deferred);
}

export const updateQueuePositions = async (updatedQueuePlayers: IQueuePlayer[]): Promise<void> => {
    // Separate players with non-null queuePosition from players with null queuePosition
    const playersWithPosition: IQueuePlayer[] = [];
    const playersWithoutPosition: IQueuePlayer[] = [];

    for (const player of updatedQueuePlayers) {
        if (player.queuePosition === 0) {
            playersWithoutPosition.push(player);
        } else if (player.queuePosition !== null) {
            playersWithPosition.push(player);
        } else {
            playersWithoutPosition.push(player);
        }
    }

    // Sort players with queuePosition and update their queuePosition values
    playersWithPosition.sort((a, b) => a.queuePosition - b.queuePosition);
    let newPosition = 1;

    for (const player of playersWithPosition) {
        player.queuePosition = newPosition;
        newPosition++;
    }

    // Combine the updated players
    const updatedQueuePositions: IQueuePlayer[] = [...playersWithPosition, ...playersWithoutPosition];
    
    await Promise.all(updatedQueuePositions.map(qp => {
        return qp.save();
    }));
};