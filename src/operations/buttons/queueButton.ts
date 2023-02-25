import { getThemeColor, mongoError } from "#utilities";
import { CacheType, ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageActionRowComponentBuilder} from "discord.js";
import { createGuild, createQueue, getPlayerByDiscordId, getQueueByPlayerIdAndMessageId, getQueuePlayersByMessageId } from "#operations";
import Queue from "../../schemas/queue";
import { IPlayer, IQueue } from "../../types";
import embed from "src/schemas/embed";

export const joinQueue = (interaction: ButtonInteraction<CacheType>): void => {
    const receivedEmbed = interaction.message.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);

    const playerQuery =  getPlayerByDiscordId(interaction.user.id);
    const queueQuery = getQueueByPlayerIdAndMessageId(interaction.message.id, interaction.user.id);
    const queuePlayers = getQueuePlayersByMessageId(interaction.message.id);

    Promise.all([playerQuery, queueQuery, queuePlayers]).then((queryResults: [IPlayer, IQueue[], IQueue[]]) => {
        if (!queryResults[0]) {
            interaction.reply({
                content: `You must first do /statregister before you can play ranked.`,
                ephemeral: true
            }).then(() => { return; });
        }
        if (!queryResults[1]) {
            interaction.reply({
                content: `You have already been added to the queue. You can either wait for a match or remove yourself.`,
                ephemeral: true
            }).then(() => { return; });
        }

        const newQueueRecord = new Queue({
            discordId: interaction.user.id,
            messageId: interaction.message.id,
            ready: false
        });

        createQueue(newQueueRecord).then(queueRecord => {
            queryResults[2].push(queueRecord);

            var queueCount = Number(queryResults[2].length);
            if (queueCount >= 7) {
                var queuePlayers = '';

                for (let i = 0; i < queryResults[2].length; i++) {
                    if(i < 1)
                    queuePlayers += `<:x:><@${queryResults[2][i].discordId}>`;
                    else
                    queuePlayers += "\n" + `<:x:><@${queryResults[2][i].discordId}>`;
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

                interaction.message.edit({
                    embeds: [queueEmbed],
                    components: [activeButtonRow1, activeButtonRow2]
                }).then(() => {
                    interaction.deferUpdate();
                });
            } else {
                queueEmbed.setFields([{
                        name: `Players in Queue - ${queueCount}`,
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    }
                ]);

                interaction.message.edit({
                    embeds: [queueEmbed]
                }).then(() => {
                    interaction.deferUpdate();
                });
            }
        }).catch(error => {
            mongoError(error);
            interaction.reply({
                content: `There was an error adding the player to the queue in the database.`,
                ephemeral: true
            });
        });
    }).catch(error => {
        mongoError(error);
        interaction.reply({
            content: `There was an error getting data from the database for user: ${interaction.user.id}`,
            ephemeral: true
        }).then(() => { return; });
    });
}