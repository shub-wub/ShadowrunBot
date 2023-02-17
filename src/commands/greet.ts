import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command : SlashCommand = {
    commandBuilder: new SlashCommandBuilder()
        .setName("test2")
        .setDescription("test"),
    execute: async (interaction, client) => {
        await interaction.reply({
            content: `Test`,
            ephemeral: true
        });
    },
    cooldown: 10
}

export default command;