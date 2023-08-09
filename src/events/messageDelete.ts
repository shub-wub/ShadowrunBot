import { mongoError } from "#utilities";
import { Client } from "discord.js";
import { BotEvent, IGuild, ILeaderboard, IMatch, IQueue, IQueuePlayer } from "../types";
import { MongooseError } from "mongoose";
import Guild from "#schemas/guild";
import Leaderboard from "#schemas/leaderboard";
import Match from "#schemas/match";
import Queue from "#schemas/queue";
import QueuePlayer from "#schemas/queuePlayer";

const event: BotEvent = {
    name: 'messageDelete',
    async execute(message, client: Client) {
        console.log("1 Message delete from message.id" + message.messageId);
        if (message.partial) await message.fetch(true);
        console.log("2 Message delete from message.id" + message.messageId);
        var guildRecord = await Guild.findOne<IGuild>({
            guildId: message.guildId,
        });
        if (message.channelId === guildRecord?.leaderboardChannelId) {
            console.log("Message delete from leaderboard.id" + message.channelId);
            const leaderboardQuery = Leaderboard.findOne<ILeaderboard>().and([{ messageId: message.id }]);
            try {
                await Leaderboard.deleteOne(leaderboardQuery);
            } catch (error) {
                mongoError(error as MongooseError);
                await message.reply({
                    content: `There was an error deleting the leaderboard in the database.`,
                    ephemeral: true
                });
            }
        } else if (message.channelId === guildRecord?.queueChannelId) {
            console.log("Message delete from queue.id" + message.channelId);
            const queueQuery = await Queue.findOne<IQueue>().and([{ messageId: message.id }]);
            const queueMessageId = queueQuery?.messageId;
            const queuePlayersQuery = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: queueMessageId, matchMessageId: { $exists: false } }]);
            try {
                await Queue.deleteOne().and([{ messageId: queueQuery?.messageId }]);
            } catch (error) {
                mongoError(error as MongooseError);
                await message.reply({
                    content: `There was an error deleting the queue from the queues in the database.`,
                    ephemeral: true
                });
            }
            try {
                await Promise.all(queuePlayersQuery.map(async (u) => {
                    await QueuePlayer.deleteOne({ _id: u._id });
                }));
            } catch (error) {
                mongoError(error as MongooseError);
                await message.reply({
                    content: `There was an error deleting the plaayers from the queueplayers in the database.`,
                    ephemeral: true
                });
            }
        } else if (message.channelId === guildRecord?.matchChannelId) {
            console.log("Message delete from match.id" + message.channelId);
            const matchQuery = await Match.findOne<IMatch>().and([{ messageId: message.id, matchWinner: { $exists: false } }]);
            if (!matchQuery) return;
            try {
                await Match.deleteOne().and([{ messageId: matchQuery?.messageId }]);
            } catch (error) {
                mongoError(error as MongooseError);
                await message.reply({
                    content: `There was an error deleting the match from the matches in the database.`,
                    ephemeral: true
                });
                return;
            }
            try {
                const queuePlayersQuery = await QueuePlayer.find<IQueuePlayer>().and([{ matchMessageId: matchQuery?.messageId }]);
                await Promise.all(queuePlayersQuery.map(async (u) => {
                    await QueuePlayer.deleteOne({ _id: u._id });
                }));
            } catch (error) {
                mongoError(error as MongooseError);
                await message.reply({
                    content: `There was an error deleting the players from the queueplayers in the database.`,
                    ephemeral: true
                });
                return;
            }

        }

    },
};

export default event;