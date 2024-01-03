import { CacheType, ButtonInteraction } from "discord.js";
import {
	createLeaderboardButtonRow,
	createLeaderboardEmbed,
} from "#operations";
import Player from "#schemas/player";
import { ILeaderboard } from "src/types";
import Leaderboard from "#schemas/leaderboard";
import { mongoError } from "#utilities";
import { MongooseError } from "mongoose";

export const pageButton = async (
	interaction: ButtonInteraction<CacheType>,
	direction: string
): Promise<void> => {
	// Retrieve the players from the database and sort by rating
	const currentDate = new Date();
	const cutoffDate = new Date().setDate(currentDate.getDate() - 21);
	const players = await Player.find({lastMatchDate: {$gte: cutoffDate}}).sort("-rating");
	const playersPerPage = 25;
	var leaderboardRecord = await Leaderboard.findOne<ILeaderboard>({
		messageId: interaction.message.id,
	});
	if (!leaderboardRecord) return;
	if (direction == "previous") leaderboardRecord.page--;
	else if (direction == "next") leaderboardRecord.page++;
	try {
		leaderboardRecord.save();
	} catch (error) {
		mongoError(error as MongooseError);
		console.log(`There was an issue updating the page number in the database.`)
	}
	const newEmbed = await createLeaderboardEmbed(
		leaderboardRecord.page,
		players,
		playersPerPage,
		leaderboardRecord.device,
		interaction.guild?.id as string
	);
	const newButtonRow = createLeaderboardButtonRow(
		leaderboardRecord.page,
		players,
		playersPerPage
	);
	await interaction.update({
		embeds: [newEmbed],
		components: [newButtonRow],
	});
};
