import { mongoError } from "#utilities";
import {
	CacheType,
	ButtonInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageActionRowComponentBuilder,
} from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import { IGuild, IPlayer, IQueue, IQueuePlayer } from "../../types";
import { MongooseError } from "mongoose";
import { getRankEmoji } from "#operations";

export const joinQueue = (interaction: ButtonInteraction<CacheType>): void => {
	const receivedEmbed = interaction.message.embeds[0];
	const queueEmbed = EmbedBuilder.from(receivedEmbed);
    const playerQuery = Player.findOne<IPlayer>({ discordId: interaction.user.id });
    const queueUserQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { discordId: interaction.user.id}]);
    const queuePlayers = QueuePlayer.find<IQueuePlayer>({ messageId: interaction.message.id });
    const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const queueQuery = Queue.findOne<IQueue>({ messageId: interaction.message.id });

    Promise.all([playerQuery, queueUserQuery, queuePlayers, guildQuery, queueQuery])
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
                content: `You'r rating: ${queryResults[0].rating} must be between ${queryResults[4].rankMin} and ${queryResults[4].rankMax}`,
                ephemeral: true
            });
            return;
        }

        var queueRecord = null;
        try {
            queueRecord = await new QueuePlayer({
                discordId: interaction.user.id,
                messageId: interaction.message.id,
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

        queryResults[2].push(queueRecord);

        var queueCount = Number(queryResults[2].length);
        var addUnreadyEmoji = false;
        if (queueCount >= 8) addUnreadyEmoji = true;
        var queuePlayers = '';
        for (let i = 0; i < queryResults[2].length; i++) {
            if(!queryResults[3]) return;
            var player = await Player.findOne<IPlayer>({ discordId: queryResults[2][i].discordId });
            if(!player) return;
            var emoji = getRankEmoji(player, queryResults[3]);
            if(addUnreadyEmoji) {
                if(i < 1)
                    queuePlayers += `:x:<@${queryResults[2][i].discordId}> ${emoji}${player.rating}`;
                else
                    queuePlayers += "\n" + `:x:<@${queryResults[2][i].discordId}> ${emoji}${player.rating}`;
            } else {
                if(i < 1)
                    queuePlayers += `<@${queryResults[2][i].discordId}> ${emoji}${player.rating}`;
                else
                    queuePlayers += "\n" + `<@${queryResults[2][i].discordId}> ${emoji}${player.rating}`;
            }
        }

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
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('readyup')
                    .setLabel('Ready Up')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(!addUnreadyEmoji),
                new ButtonBuilder()
                    .setCustomId('removeQueue')
                    .setLabel('Remove Me')
                    .setStyle(ButtonStyle.Danger),
                ]);

        await interaction.message.edit({
            embeds: [queueEmbed],
            components: [activeButtonRow1]
        });
        await interaction.deferUpdate();
    }).catch(async error => {
        mongoError(error);
        await interaction.reply({
            content: `There was an error getting data from the database for user: ${interaction.user.id}`,
            ephemeral: true
        });
        return;
    });
}
