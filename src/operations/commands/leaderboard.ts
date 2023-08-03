import { getThemeColor, mongoError } from "#utilities";
import {
	CommandInteraction,
	CacheType,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	TextChannel,
	Client,
	BaseInteraction,
	ButtonInteraction,
} from "discord.js";
import { IGuild, IPlayer, ILeaderboard, Field } from "../../types";
import Guild from "#schemas/guild";
import Leaderboard from "#schemas/leaderboard";
import { MongooseError } from "mongoose";
import { getRankEmoji } from "#operations";

// Define a function to create a message embed with a given page of players
export const createLeaderboardEmbed = async (
	pageNumber: number,
	players: IPlayer[],
	playersPerPage: number,
	device: string,
	guildId: string
): Promise<any> => {
	const start = (pageNumber - 1) * playersPerPage;
	const end = start + playersPerPage;
	const pagePlayers = players.slice(start, end);
	const guildRecord = await Guild.findOne<IGuild>({ guildId: guildId });
	if (!guildRecord) return;
	var fields: Field[] = [];

    if (device == "mobile") {
        for (let i = 0; i < pagePlayers.length; i++) {
            const playerPlace = i + 1 + (25 * (pageNumber - 1));

            var wlr = pagePlayers[i].wins / (pagePlayers[i].wins + pagePlayers[i].losses);

            var emoji = getRankEmoji(pagePlayers[i], guildRecord);

			wlr = Math.round(wlr * 100) / 100;
            fields.push({name: " ", value: `**${playerPlace}.** <@${pagePlayers[i].discordId}> - ${emoji}${pagePlayers[i].rating} - ${wlr}`, inline: false});
        }
    } else if (device == "pc") {
        var names = "";
        var ratings = "";
        var winlossratio = "";
        for (let i = 0; i < pagePlayers.length; i++) {
            const playerPlace = i + 1 + 25 * (pageNumber - 10);

            var wlr = pagePlayers[i].wins / (pagePlayers[i].wins + pagePlayers[i].losses);

            var emoji = getRankEmoji(pagePlayers[i], guildRecord);

            wlr = Math.round(wlr * 100) / 100;
            names += `**${playerPlace}.** <@${pagePlayers[i].discordId}>\n`;
            ratings += `${emoji}${pagePlayers[i].rating}\n`;
            winlossratio += `${wlr}\n`;
        }
        fields.push({name: "Name", value: names, inline: true});
        fields.push({name: "Rating", value: ratings, inline: true});
        fields.push({name: "Win Loss Ratio", value: winlossratio, inline: true});
    }
    const embed: any = new EmbedBuilder()
        .setTitle('__**ELO Leaderboard**__')
        .setColor(getThemeColor("embed"))
        .setFooter({ text: `Page ${pageNumber} of ${Math.ceil(players.length / playersPerPage)}` })
        .addFields(fields);
    return embed;
};

// Set up a button row with pagination buttons
export const createLeaderboardButtonRow = (
	pageNumber: number,
	players: IPlayer[],
	playersPerPage: number
): ActionRowBuilder<ButtonBuilder> => {
	const buttonRow: ActionRowBuilder<ButtonBuilder> =
		new ActionRowBuilder<ButtonBuilder>();
	const previousButton = new ButtonBuilder()
		.setCustomId("previous")
		.setLabel("Previous")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(pageNumber === 1);
	const nextButton = new ButtonBuilder()
		.setCustomId("next")
		.setLabel("Next")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(pageNumber === Math.ceil(players.length / playersPerPage));
	buttonRow.addComponents(previousButton, nextButton);
	return buttonRow;
};

export const leaderboard = async (
	interaction: CommandInteraction<CacheType>,
	client: Client,
	players: IPlayer[],
	playersPerPage: number,
	device: string
): Promise<void> => {
	// Send the initial message with the first page of players and pagination buttons
	const initialEmbed = await createLeaderboardEmbed(
		1,
		players,
		playersPerPage,
		device,
		interaction.guild?.id as string
	);
	const buttonRow = createLeaderboardButtonRow(1, players, playersPerPage);

	var guildRecord = await Guild.findOne<IGuild>({
		guildId: interaction.guildId,
	});
	if (guildRecord) {
		var channel = await client.channels.fetch(
			guildRecord.leaderboardChannelId
		);
		var message = await (channel as TextChannel).send({
			embeds: [initialEmbed],
			components: [buttonRow],
		});
		// new leaderboard
		try {
			await new Leaderboard({
				messageId: message.id,
				device: device,
				page: 1,
			}).save();
		} catch (error) {
			mongoError(error as MongooseError);
			await interaction.reply({
				content: `There was an error adding the leaderboard to the database.`,
				ephemeral: true,
			});
			return;
		}
		await interaction.reply({
			content: `The leaderboard has been created. ${message.url}`,
			ephemeral: true,
		});
	} else {
		await interaction.reply({
			content: `There was no guild record found. Try using /srinitialize first.`,
			ephemeral: true,
		});
	}
};
