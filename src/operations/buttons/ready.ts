import { mongoError } from "#utilities";
import { CacheType, ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder} from "discord.js";
import Queue from "../../schemas/queuePlayer";
import Player from "../../schemas/player";
import { IPlayer, IQueuePlayer } from "../../types";
import { MongooseError } from "mongoose";

export const joinQueue = (interaction: ButtonInteraction<CacheType>): void => {
    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);

    const playerQuery = Player.findOne<IPlayer>({ discordId: interaction.user.id });
    const queueQuery = Queue.find<IQueuePlayer>().and([{ messageId: interaction.message.id}, { discordId: interaction.user.id}]);
    const queuePlayers = Queue.find<IQueuePlayer>({ messageId: interaction.message.id });

    Promise.all([playerQuery, queueQuery, queuePlayers]).then(async (queryResults: [IPlayer | null, IQueuePlayer[], IQueuePlayer[]]) => {
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

        var queueRecord = null;
        try {
            queueRecord = await new Queue({
                discordId: interaction.user.id,
                messageId: interaction.message.id,
                ready: false
            }).save();
        } catch(error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error adding the player to the queue in the database.`,
                ephemeral: true
            });
            return;
        }

        queryResults[2].push(queueRecord);

        var queueCount = Number(queryResults[2].length);
        var addUnreadyEmoji = false;
        if (queueCount >= 8) addUnreadyEmoji = true

        var queuePlayers = '';
        for (let i = 0; i < queryResults[2].length; i++) {
            if(addUnreadyEmoji) {
                if(i < 1)
                    queuePlayers += `:x:<@${queryResults[2][i].discordId}>`;
                else
                    queuePlayers += "\n" + `:x:<@${queryResults[2][i].discordId}>`;
            } else {
                if(i < 1)
                    queuePlayers += `<@${queryResults[2][i].discordId}>`;
                else
                    queuePlayers += "\n" + `<@${queryResults[2][i].discordId}>`;
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
                    .setDisabled(false),
                new ButtonBuilder()
                    .setCustomId('removeQueue')
                    .setLabel('Remove Me')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('requeue')
                    .setLabel('Requeue')
                    .setStyle(ButtonStyle.Danger),
                ]);
        const activeButtonRow2 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('ready-player')
                    .setLabel('Ready Up Player')
                    .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                    .setCustomId('queue-player')
                    .setLabel('Queue Player')
                    .setStyle(ButtonStyle.Success),
                ]);

        await interaction.message.edit({
            embeds: [queueEmbed],
            components: [activeButtonRow1, activeButtonRow2]
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