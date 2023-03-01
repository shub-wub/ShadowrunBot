import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, Client, CommandInteraction, EmbedBuilder, MessageActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import { getThemeColor, mongoError } from "#utilities";
import { createEmbed, getGuildByGuildId } from "#operations";
import Embed from "../../schemas/embed";
import { MongooseError } from "mongoose";

export const openQueueModal = (interaction: CommandInteraction<CacheType>): void => {
    const modal = new ModalBuilder()
        .setCustomId('queue')
        .setTitle('Create a queue')
        .addComponents([
        new ActionRowBuilder<TextInputBuilder>().addComponents([
            new TextInputBuilder()
                .setCustomId('maxPlayers')
                .setLabel('Lobby Max Players')
                .setValue('8')
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
        ]),
        new ActionRowBuilder<TextInputBuilder>().addComponents([
            new TextInputBuilder()
                .setCustomId('ranked')
                .setLabel('Ranked? yes/no')
                .setValue("yes")
                .setRequired(true)
                .setStyle(TextInputStyle.Short)
        ]),
        new ActionRowBuilder<TextInputBuilder>().addComponents([
            new TextInputBuilder()
                .setCustomId('descriptionInput')
                .setLabel('Queue Description')
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph)
        ])
    ]);

    interaction.showModal(modal);
}

export const submitQueueModal = async (interaction: ModalSubmitInteraction<CacheType>, client: Client): Promise<void> => {
    const newEmbed = new EmbedBuilder()
        .setTitle('Queue')
        .setColor(getThemeColor("embed"))
        .addFields([
            {
                name: `Players in Queue - 0`,
                value: `\u200b`,
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
                .setCustomId('readyup')
                .setLabel('Ready Up')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
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
    var guildRecord = await getGuildByGuildId(interaction.guildId as string);
    if(guildRecord) {
        var channel = await client.channels.fetch(guildRecord.queueChannelId);
        var message = await (channel as TextChannel).send({
            embeds: [newEmbed], 
            components: [activeButtonRow1, activeButtonRow2]
        });
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

        try {
        await createEmbed(embed);
            await interaction.reply({
                content: `The queue has been created. ${message.url}`,
                ephemeral: true
            });
        } catch(error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error creating the Embed record in the database.`,
                ephemeral: true
            });
            return;
        };
    } else {
        await interaction.reply({
            content: `There was no guild record found. Try using /srinitialize first.`,
            ephemeral: true
        });
    }
}