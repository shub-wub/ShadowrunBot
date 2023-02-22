import { createEmbed } from "../../operations/embed";
import { Modal } from "../../types";
import Embed from "../../schemas/embed";
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageActionRowComponentBuilder, Client, TextChannel } from 'discord.js';
import { getThemeColor, mongoError } from "../../utilities";
import { getGuildByGuildId } from "../../operations/guild";

const modal : Modal = {
    data: {
        name: 'queue'
    },
    execute: (interaction, client: Client) => {
        const newEmbed = new EmbedBuilder()
        .setTitle('Queue')
        .setColor(getThemeColor("embed"))
        .addFields([
            {
                name: `MatchCount`,
                value: '0',
                inline: false
            },
            {
                name: `Queue`,
                value: `+`,
                inline: false
            }
        ]);
        const activeButtonRow1 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('queue')
                    .setLabel('Queue')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('queue-player')
                    .setLabel('Queue Player')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('removeQueue')
                    .setLabel('Remove Me')
                    .setStyle(ButtonStyle.Danger),
                ]);
        const activeButtonRow2 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('requeue')
                    .setLabel('Requeue')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('readyup')
                    .setLabel('Ready Up')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ready-player')
                    .setLabel('Ready Up Player')
                    .setStyle(ButtonStyle.Secondary),
                ]);
        const activeButtonRow3 = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('score-match')
                    .setLabel('Score Match')
                    .setStyle(ButtonStyle.Danger)
                ]);
        getGuildByGuildId(interaction.guildId as string).then(guildRecord => {
            client.channels.fetch(guildRecord.queueChannelId).then(channel => {
                (channel as TextChannel).send({
                    embeds: [newEmbed], 
                    components: [activeButtonRow1, activeButtonRow2, activeButtonRow3]
                }).then(message => {
                    const embed = new Embed({
                        messageId: message.id,
                        title: newEmbed.data.title,
                        description: newEmbed.data.description,
                        url: newEmbed.data.url,
                        timestamp: newEmbed.data.timestamp,
                        color: newEmbed.data.color,
                        footer: newEmbed.data.footer,
                        image: newEmbed.data.image,
                        thumbnail: newEmbed.data.thumbnail,
                        provider: newEmbed.data.provider,
                        author: newEmbed.data.author,
                        fields: newEmbed.data.fields,
                        video: newEmbed.data.video,
                    });
            
                    createEmbed(embed).then(() => {
                        interaction.reply({
                            content: `The queue has been created. ${message.url}`,
                            ephemeral: true
                        });
                    }).catch(error => {
                        mongoError(error);
                        interaction.reply({
                            content: `There was an error creating the Embed record in the database.`,
                            ephemeral: true
                        });
                    });
                });
            });
        });
    },
    cooldown: 10
}

export default modal;