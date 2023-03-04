import { mongoError } from "#utilities";
import {
	CacheType,
	ChannelType,
	CommandInteraction,
	GuildEmoji,
	MappedGuildChannelTypes,
	Role,
	TextChannel,
} from "discord.js";
import Guild from "#schemas/guild";
import { MongooseError } from "mongoose";
import { IGuild } from "../../types";

export const srinitialize = async (
	interaction: CommandInteraction<CacheType>
): Promise<void> => {
	const existingGuildRecord = await Guild.findOne<IGuild>({
		guildId: interaction.guildId,
	});
	if (existingGuildRecord) {
		await interaction.reply({
			content: `srinitialize has already been ran on this server.`,
			ephemeral: true,
		});
		return;
	}

	const bronzeRoleCreate = interaction.guild?.roles.create({
		name: "Bronze",
		color: "DarkOrange",
		reason: "ShadowrunBot Ranked",
	});
	const silverRoleCreate = interaction.guild?.roles.create({
		name: "Silver",
		color: "Greyple",
		reason: "ShadowrunBot Ranked",
	});
	const goldRoleCreate = interaction.guild?.roles.create({
		name: "Gold",
		color: "Gold",
		reason: "ShadowrunBot Ranked",
	});
	const platinumRoleCreate = interaction.guild?.roles.create({
		name: "Platinum",
		color: "DarkGreen",
		reason: "ShadowrunBot Ranked",
	});
	const diamondRoleCreate = interaction.guild?.roles.create({
		name: "Diamond",
		color: "Aqua",
		reason: "ShadowrunBot Ranked",
	});

	const bronzeEmojiCreate = interaction.guild?.emojis.create({
		attachment: "./assets/bronze.webp",
		name: "bronze",
		reason: "ShadowrunBot Ranked",
	});
	const silverEmojiCreate = interaction.guild?.emojis.create({
		attachment: "./assets/silver.webp",
		name: "silver",
		reason: "ShadowrunBot Ranked",
	});
	const goldEmojiCreate = interaction.guild?.emojis.create({
		attachment: "./assets/gold.webp",
		name: "gold",
		reason: "ShadowrunBot Ranked",
	});
	const platinumEmojiCreate = interaction.guild?.emojis.create({
		attachment: "./assets/platinum.webp",
		name: "platinum",
		reason: "ShadowrunBot Ranked",
	});
	const diamondEmojiCreate = interaction.guild?.emojis.create({
		attachment: "./assets/diamond.webp",
		name: "diamond",
		reason: "ShadowrunBot Ranked",
	});

	const cat = (await interaction.guild?.channels.create({
		name: "Ranked",
		type: ChannelType.GuildCategory,
	})) as MappedGuildChannelTypes[ChannelType.GuildCategory];

	const queueChannelCreate = interaction.guild?.channels.create({
		name: "queue",
		type: ChannelType.GuildText,
		parent: cat.id,
	});
	const matchChannelCreate = interaction.guild?.channels.create({
		name: "matches",
		type: ChannelType.GuildText,
		parent: cat.id,
	});
	const leaderboardChannelCreate = interaction.guild?.channels.create({
		name: "leaderboard",
		type: ChannelType.GuildText,
		parent: cat.id,
	});

	Promise.all([
		queueChannelCreate as Promise<TextChannel>,
		matchChannelCreate as Promise<TextChannel>,
		leaderboardChannelCreate as Promise<TextChannel>,
		bronzeEmojiCreate as Promise<GuildEmoji>,
		silverEmojiCreate as Promise<GuildEmoji>,
		goldEmojiCreate as Promise<GuildEmoji>,
		platinumEmojiCreate as Promise<GuildEmoji>,
		diamondEmojiCreate as Promise<GuildEmoji>,
		bronzeRoleCreate as Promise<Role>,
		silverRoleCreate as Promise<Role>,
		goldRoleCreate as Promise<Role>,
		platinumRoleCreate as Promise<Role>,
		diamondRoleCreate as Promise<Role>,
	]).then(async (results) => {
		try {
			await new Guild({
				guildId: interaction.commandGuildId as string,
				rankedCategoryId: cat.id,
				queueChannelId: results[0].id,
				matchChannelId: results[1].id,
				leaderboardChannelId: results[2].id,
				bronzeEmojiId: results[3].id,
				silverEmojiId: results[4].id,
				goldEmojiId: results[5].id,
				platinumEmojiId: results[6].id,
				diamondEmojiId: results[7].id,
				bronzeRoleId: results[8].id,
				silverRoleId: results[9].id,
				goldRoleId: results[10].id,
				platinumRoleId: results[11].id,
				diamondRoleId: results[12].id,
				bronzeMin: 0,
				bronzeMax: 799,
				silverMin: 800,
				silverMax: 1099,
				goldMin: 1100,
				goldMax: 1299,
				platinumMin: 1300,
				platinumMax: 1499,
				diamondMin: 1500,
				diamondMax: 3000,
			}).save();
			await interaction.reply({
				content: `Ranked Category was created. Ranked emojis were created. Ranked roles were created.`,
				ephemeral: true,
			});
		} catch (error) {
			mongoError(error as MongooseError);
			await interaction.reply({
				content: `There was an error creating the guild record in the database.`,
				ephemeral: true,
			});
		}
	});
};
