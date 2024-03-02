import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot to make sure it is running"),
	execute: async (interaction: CommandInteraction, client: Client) => {
		await interaction.reply({ content: "pong", ephemeral: true });
	},
	cooldown: 1,
};

export default command;
