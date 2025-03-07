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
	var leaderboardRecord = await Leaderboard.findOne<ILeaderboard>({
		messageId: interaction.message.id,
	});
	if (!leaderboardRecord) return;
	// Retrieve the players from the database and sort by rating
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - 14);
	const sortOption = {} as any;
	leaderboardRecord.device == "pc2" ? sortOption['mapsPlayed'] = -1 : sortOption['rating'] = -1;
	const players = await Player.aggregate([
		{$match: {lastMatchDate: {$gte: cutoffDate}}},
		{$addFields: {"mapsPlayed": {$add: ["$wins", "$losses"]}}},
		{$sort: sortOption}
	]);
	const playersPerPage = 25;
	if (direction == "previous") leaderboardRecord.page > 1 && leaderboardRecord.page <= Math.ceil(players.length / playersPerPage) ? leaderboardRecord.page-- : leaderboardRecord.page = 1;
	else if (direction == "next") leaderboardRecord.page >= 1 && leaderboardRecord.page < Math.ceil(players.length / playersPerPage) ? leaderboardRecord.page++ : leaderboardRecord.page = 1;
	else if (direction == "reload") leaderboardRecord.page = leaderboardRecord.page > Math.ceil(players.length / playersPerPage) || leaderboardRecord.page <= 0 ? 1 : leaderboardRecord.page;
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
