import { ActionRowBuilder, ModalBuilder, PermissionFlagsBits, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { SlashCommand } from "../types";

const command : SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Create a queue"),
    execute: async (interaction, client) => {
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
    
        await interaction.showModal(modal);
    },
    cooldown: 10
}

export default command;