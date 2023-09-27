import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { leaderboard } from "#operations";
import Player from "#schemas/player";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot to make sure it is running"),
	execute: async (interaction: CommandInteraction, client: Client) => {
		// Retrieve the players from the database and sort by rating
		// const players = await Player.find().sort("-rating");
		// const playersPerPage = 25;
		// var device: string = (interaction.options as any).getString("device");
		await interaction.reply({content: "pong", ephemeral: true});
	},
	cooldown: 1,
};

export default command;