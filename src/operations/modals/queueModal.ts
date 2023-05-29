import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	CacheType,
	Client,
	CommandInteraction,
	EmbedBuilder,
	MessageActionRowComponentBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { getThemeColor, mongoError } from "#utilities";
import { IGuild } from "../../types";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import { MongooseError } from "mongoose";

export const openQueueModal = (interaction: CommandInteraction<CacheType>): void => {
	const modal = new ModalBuilder()
		.setCustomId("queue")
		.setTitle("Create a queue")
		.addComponents([
			new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("maxRank")
					.setLabel("Max Rank")
					.setValue("3000")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
            new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("minRank")
					.setLabel("Min Rank")
					.setValue("0")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
		]);
	interaction.showModal(modal);
};

export const submitQueueModal = async (interaction: ModalSubmitInteraction<CacheType>, client: Client): Promise<void> => {
    var min = interaction.fields.getTextInputValue("minRank");
    var max = interaction.fields.getTextInputValue("maxRank");
    const newEmbed = new EmbedBuilder()
        .setTitle(`${min}-${max} Queue`)
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
    var guildRecord = await Guild.findOne<IGuild>({ guildId: interaction.guildId });
    if(guildRecord) {
        var channel = await client.channels.fetch(guildRecord.queueChannelId);
        var message = await (channel as TextChannel).send({
            embeds: [newEmbed], 
            components: [activeButtonRow1/*, activeButtonRow2*/]
        });
        try {
            await new Queue({
                messageId: message.id,
                rankMin: min,
                rankMax: max
            }).save();
        } catch (error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error saving the Queue record to the database.`,
                ephemeral: true,
            });
            return;
        }
        await interaction.reply({
            content: `The queue has been created. ${message.url}`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `There was no guild record found. Try using /srinitialize first.`,
            ephemeral: true
        });
    }
}
