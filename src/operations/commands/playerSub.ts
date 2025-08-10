import { CommandInteraction, MessageFlags, Client, CacheType, EmbedBuilder } from 'discord.js';
import { IPlayer, IQueuePlayer, IGuild } from '../../types';
import { createMatch, rebuildQueue, removeNewMatchPlayersFromOtherQueues, updateQueuePositions } from '#operations';
import Player from '#schemas/player';
import QueuePlayer from '#schemas/queuePlayer';
import Guild from '#schemas/guild';
import Queue from '#schemas/queue';
import Match from '#schemas/match';
import { TextChannel } from 'discord.js';

export const playerSub = async (
    interaction: CommandInteraction<CacheType>,
    client: Client
): Promise<void> => {
    try {
        const player1Input = (interaction as any).options.getUser('player1');
        const player2Input = (interaction as any).options.getUser('player2');
        if (!player1Input || !player2Input) return;
        const player1Username = player1Input.username;
        const player2Username = player2Input.username;
        const discordId1 = player1Input.id;
        const discordId2 = player2Input.id;
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + ' ' + interaction.user.username + ' submitted command player sub for ' + player1Username + ' to sub in ' + player2Username);
        const player1Query = Player.findOne<IPlayer>({discordId: discordId1});
        const player2Query = Player.findOne<IPlayer>({discordId: discordId2});
        const guild = await Guild.findOne<IGuild>({
            guildId: interaction.guildId,
        });
        const matchChannelId = guild?.matchChannelId;
        if (!matchChannelId) throw Error("Could not find match channel in DB");
        const queueChannelId = guild?.queueChannelId;
        if (!queueChannelId) throw Error("Could not find queue channel in DB");
        await Promise.all([player1Query, player2Query])
        .then(async (queryResults: [IPlayer | null, IPlayer | null]) => {
            const player1 = queryResults[0];
            const player2 = queryResults[1];
            if (!player1) throw Error(`Could not find player1 in DB with ${discordId1}`);
            else if (!player2) throw Error(`Could not find player2 in DB with ${discordId2}`);
            var player1QueuePlayerEntry = await QueuePlayer.findOne<IQueuePlayer>().and([{ discordId: discordId1 }, { matchMessageId: { $exists: true } }]);
            if (!player1QueuePlayerEntry) {
                await interaction.reply({
                    content: `Player 1 (${player1Username}) is not currently in a match. Cannot sub them out.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            var player2QueuePlayerEntries = await QueuePlayer.find<IQueuePlayer>().and([{discordId: discordId2}]);
            var player2InMatch = false;
            for (const entry of player2QueuePlayerEntries) {if (entry?.matchMessageId !== undefined) player2InMatch = true;}
            if (player2InMatch) {
                await interaction.reply({
                    content: `Player 2 (${player2Username}) currently has an unscored match. Cannot sub them in.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const queueChannel = await client.channels.fetch(queueChannelId);
            const queueEmbedMessage = await (queueChannel as TextChannel).messages.fetch(player1QueuePlayerEntry.messageId);
            if (!queueEmbedMessage) {
                await interaction.reply({
                    content: `Could not find the queue that Player 1 originally queued in.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const matchChannel = await client.channels.fetch(matchChannelId);
            const matchMessage = await (matchChannel as TextChannel).messages.fetch(player1QueuePlayerEntry.matchMessageId);
            if (!matchMessage) {
                await interaction.reply({
                    content: `Could not find the match that Player 1 is in.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            const queue = await Queue.findOne().and([{discordId: player1QueuePlayerEntry.messageId}]);
            if (!queue) throw Error('Queue not found in DB');


            var allPlayersInSameMatch = await QueuePlayer.find<IQueuePlayer>().and([{matchMessageId: matchMessage.id}]);
            var newPlayersForMatch: IQueuePlayer[] = []
            for (var i = 0; i < allPlayersInSameMatch.length; i++) {
                if (allPlayersInSameMatch[i].discordId != player1.discordId){
                    newPlayersForMatch.push(allPlayersInSameMatch[i])
                    await allPlayersInSameMatch[i].updateOne({ $unset: { matchMessageId: 1, team: 1 } });

                }
            }

            var player2QueuePlayerEntryForThisQueue = null;
            for (const entry of player2QueuePlayerEntries) {
                if (entry?.messageId == player1QueuePlayerEntry.messageId) {
                    player2QueuePlayerEntryForThisQueue = entry;
                }
            }
            if (!player2QueuePlayerEntryForThisQueue) {
                player2QueuePlayerEntryForThisQueue = await new QueuePlayer({
                    discordId: player2.discordId,
                    messageId: player1QueuePlayerEntry.messageId,
                }).save();
            }
            newPlayersForMatch.push(player2QueuePlayerEntryForThisQueue);

            
            await (matchChannel as TextChannel).messages.delete(matchMessage.id);

            await Match.deleteOne({messageId: matchMessage.id});
            await QueuePlayer.deleteOne({ _id: player1QueuePlayerEntry._id });


            await createMatch(interaction, client, newPlayersForMatch, queue);

            const foundQueueEmbed = queueEmbedMessage.embeds[0];
            const queueEmbed = EmbedBuilder.from(foundQueueEmbed);
            await removeNewMatchPlayersFromOtherQueues(interaction, newPlayersForMatch);

            var updatedQueuePlayers = await QueuePlayer.find<IQueuePlayer>().and([{ messageId: player2QueuePlayerEntryForThisQueue.messageId }, { matchMessageId: { $exists: false } }]);
            await updateQueuePositions(updatedQueuePlayers);

            rebuildQueue(interaction, queueEmbed, queueEmbedMessage, updatedQueuePlayers, guild, queue, false);

            await interaction.reply({
                content: `Subbed out ${player1Username}, Subbed in ${player2Username}.`,
                flags: MessageFlags.Ephemeral
            });
            
        })
    } catch (error) {
        console.log(error)
        return;
    }
};
