import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { leaderboard } from "#operations";
import Player from "#schemas/player";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("leaderboard")
		.setDescription("Print out leaderboard stats")
		.addStringOption((option) =>
			option
				.setName("device")
				.setDescription('Enter either "pc", "pc2", or "mobile"')
				.setRequired(true)
		),
	execute: async (interaction: CommandInteraction, client: Client) => {
		// Retrieve the players from the database and sort by rating
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 21);
		var device: string = (interaction.options as any).getString("device");
		const sortOption = {} as any;
		device == "pc2" ? sortOption['mapsPlayed'] = -1 : sortOption['rating'] = -1;

		const players = await Player.aggregate([
			{$match: {lastMatchDate: {$gte: cutoffDate}}},
			{$addFields: {"mapsPlayed": {$add: ["$wins", "$losses"]}}},
			{$sort: sortOption}
		]);
		const playersPerPage = 25;
		await leaderboard(
			interaction,
			client,
			players,
			playersPerPage,
			device.toLowerCase()
		);
	},
	cooldown: 10,
};

export default command;
