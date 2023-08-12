import { ActionRowBuilder, ButtonInteraction, CacheType, Client, Embed, EmbedBuilder, Guild, GuildMember, ModalBuilder, ModalSubmitInteraction, TextChannel, TextInputBuilder, TextInputStyle, Permissions, PermissionFlagsBits, PermissionsBitField } from "discord.js";
import { getThemeColor, mongoError } from "#utilities";
import { Field, IGuild, IMap, IMatch, IMatchPlayer, IPlayer, IQueue, IQueuePlayer } from "../../types";
import Player from "#schemas/player";
import GuildRecord from "#schemas/guild";
import Queue from "#schemas/queue";
import QueuePlayer from "#schemas/queuePlayer";
import Match from "#schemas/match";
import MatchPlayer from "#schemas/matchPlayer";
import Map from "#schemas/map";
import { MongooseError } from "mongoose";
import { calculateTeamElo, createMatchButtonRow1, createMatchButtonRow2, getRankEmoji, getRankRole, rebuildQueue, updateQueueEmbed, updateQueuePositions } from "#operations";
import { truncateSync } from "fs";

export const openScoreModal = (interaction: ButtonInteraction<CacheType>, team: number, game: number): void => {
	const modal = new ModalBuilder()
		.setCustomId(`scoret${team}g${game}`)
		.setTitle("Score a Map")
		.addComponents([
			new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("team1RoundsWon")
					.setLabel("Team 1 Rounds Won")
					.setPlaceholder("0")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
            new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("team2RoundsWon")
					.setLabel("Team 2 Rounds Won")
					.setPlaceholder("0")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
		]);

	interaction.showModal(modal);
};

export const submitScoreModal = async (interaction: ModalSubmitInteraction<CacheType>, client: Client, team: number, game: number): Promise<void> => {
    var team1RoundsWon = Number(interaction.fields.getTextInputValue("team1RoundsWon"));
    var team2RoundsWon = Number(interaction.fields.getTextInputValue("team2RoundsWon"));
    const matchQuery = Match.findOne<IMatch>({ messageId: interaction.message?.id });
    const matchPlayersQuery = QueuePlayer.find<IQueuePlayer>({ matchMessageId: interaction.message?.id });
	const guildQuery = GuildRecord.findOne<IGuild>({ guildId: interaction.guildId });
    Promise.all([matchQuery, matchPlayersQuery, guildQuery]).then(async (queryResults: [IMatch | null, IQueuePlayer[], IGuild | null]) => {
		var match = queryResults[0] as IMatch;
		var guild = queryResults[2] as IGuild;
		var team1 = queryResults[1].filter(player => player.team == 1);
		var team2 = queryResults[1].filter(player => player.team == 2);
		var team1Players: IPlayer[] = (await Promise.all(team1.map(async (qp) => {
			return await Player.find<IPlayer>({ discordId: qp.discordId });
		}))).flat();
		var team2Players: IPlayer[] = (await Promise.all(team2.map(async (qp) => {
			return await Player.find<IPlayer>({ discordId: qp.discordId });
		}))).flat();
		switch(game) {
			case 1:
				if(team == 1) {
					match.team1ReportedT1G1Rounds = team1RoundsWon;
					match.team1ReportedT2G1Rounds = team2RoundsWon;
					match.save();
					var matchButtonRow1 = createMatchButtonRow1(true, false, true);
					await interaction.message?.edit({
						components: [matchButtonRow1, interaction.message?.components[1]]
					});
					await interaction.deferUpdate().catch(error => {
						console.log(error);
					});
				} else {
					match.team2ReportedT1G1Rounds = team1RoundsWon;
					match.team2ReportedT2G1Rounds = team2RoundsWon;
					match.save();
					var matchButtonRow2 = createMatchButtonRow2(true, false, true);
					await interaction.message?.edit({
						components: [interaction.message?.components[0], matchButtonRow2]
					});
					await interaction.deferUpdate().catch(error => {
						console.log(error);
					});
				}
				break;
			case 2:
				if(team == 1) {
					match.team1ReportedT1G2Rounds = team1RoundsWon;
					match.team1ReportedT2G2Rounds = team2RoundsWon;
					match.save();
					var matchButtonRow1 = createMatchButtonRow1(true, true, false);
					await interaction.message?.edit({
						components: [matchButtonRow1, interaction.message?.components[1]]
					});
				} else {
					match.team2ReportedT1G2Rounds = team1RoundsWon;
					match.team2ReportedT2G2Rounds = team2RoundsWon;
					match.save();
					var matchButtonRow2 = createMatchButtonRow2(true, true, false);
					await interaction.message?.edit({
						components: [interaction.message?.components[0], matchButtonRow2]
					});
				}
				// if both teams have reported, and their reports match, and one team won 2-0, then finalize
				if ((match.team1ReportedT1G2Rounds > 0 || match.team1ReportedT2G2Rounds > 0) &&
					(match.team2ReportedT1G2Rounds > 0 || match.team2ReportedT2G2Rounds > 0) &&
					match.team1ReportedT1G1Rounds == match.team2ReportedT1G1Rounds && 
					match.team1ReportedT1G2Rounds == match.team2ReportedT1G2Rounds && 
					(match.team1ReportedT1G1Rounds == 6 && match.team1ReportedT1G2Rounds == 6 ||
					match.team1ReportedT2G1Rounds == 6 && match.team1ReportedT2G2Rounds == 6 )) {
						finalizeMatch(interaction, client, team1Players, team2Players, guild, match);
					} else {
						await interaction.deferUpdate().catch(error => {
							console.log(error);
						});
					}
				break;				
			case 3:
				if(team == 1) {
					match.team1ReportedT1G3Rounds = team1RoundsWon;
					match.team1ReportedT2G3Rounds = team2RoundsWon;
				} else {
					match.team2ReportedT1G3Rounds = team1RoundsWon;
					match.team2ReportedT2G3Rounds = team2RoundsWon;
				}
				if((match.team1ReportedT1G3Rounds > 0 || match.team1ReportedT2G3Rounds > 0) &&
				   (match.team2ReportedT1G3Rounds > 0 || match.team2ReportedT2G3Rounds > 0)) {
					finalizeMatch(interaction, client, team1Players, team2Players, guild, match);
				} else {
					match.save();
					await interaction.deferUpdate().catch(error => {
						console.log(error);
					});
				}
				break;
		}
    });
}

export const finalizeMatch = async (interaction: ModalSubmitInteraction<CacheType>, client: Client, team1Players: IPlayer[], team2Players: IPlayer[], guild: IGuild, match: IMatch): Promise<void> => {
	// if both teams scores match for all rounds
	if (match.team1ReportedT1G1Rounds == match.team2ReportedT1G1Rounds && 
		match.team1ReportedT1G2Rounds == match.team2ReportedT1G2Rounds && 
		match.team1ReportedT1G3Rounds == match.team2ReportedT1G3Rounds &&
		match.team1ReportedT2G1Rounds == match.team2ReportedT2G1Rounds && 
		match.team1ReportedT2G2Rounds == match.team2ReportedT2G2Rounds && 
		match.team1ReportedT2G3Rounds == match.team2ReportedT2G3Rounds) {

		// we have to serialize and deserialize the object to create a snapshot.
		const playersWithPreviousRating = JSON.parse(JSON.stringify(team1Players.concat(team2Players)));

		// score game 1
		if(match.team1ReportedT1G1Rounds == 6) {
			calculateTeamElo(team1Players, team2Players, match.team1ReportedT1G1Rounds, match.team1ReportedT2G1Rounds);
			match.map1 = `${match.map1} Team 1 (${match.team1ReportedT1G1Rounds}-${match.team1ReportedT2G1Rounds})`;
			match.map1Winner = "Team 1";
		} else if(match.team1ReportedT2G1Rounds == 6) {
			calculateTeamElo(team2Players, team1Players, match.team1ReportedT1G1Rounds, match.team1ReportedT2G1Rounds);
			match.map1 = `${match.map1} Team 2 (${match.team1ReportedT2G1Rounds}-${match.team1ReportedT1G1Rounds})`;
			match.map1Winner = "Team 2";
		}
		// score game 2
		if(match.team1ReportedT1G2Rounds == 6) {
			calculateTeamElo(team1Players, team2Players, match.team1ReportedT1G2Rounds, match.team1ReportedT2G2Rounds);
			match.map2 = `${match.map2} Team 1 (${match.team1ReportedT1G2Rounds}-${match.team1ReportedT2G2Rounds})`;
			match.map2Winner = "Team 1";
		} else if(match.team1ReportedT2G2Rounds == 6) {
			calculateTeamElo(team2Players, team1Players, match.team1ReportedT1G2Rounds, match.team1ReportedT2G2Rounds);
			match.map2 = `${match.map2} Team 2 (${match.team1ReportedT2G2Rounds}-${match.team1ReportedT1G2Rounds})`;
			match.map2Winner = "Team 2";
		}
		// score game 3
		if(match.team1ReportedT1G3Rounds == 6) {
			calculateTeamElo(team1Players, team2Players, match.team1ReportedT1G3Rounds, match.team1ReportedT2G3Rounds);
			match.map3 = `${match.map3} Team 1 (${match.team1ReportedT1G3Rounds}-${match.team1ReportedT2G3Rounds})`;
			match.map3Winner = "Team 1";
		} else if(match.team1ReportedT2G3Rounds == 6) {
			calculateTeamElo(team2Players, team1Players, match.team1ReportedT1G3Rounds, match.team1ReportedT2G3Rounds);
			match.map3 = `${match.map3} Team 2 (${match.team1ReportedT2G3Rounds}-${match.team1ReportedT1G3Rounds})`;
			match.map3Winner = "Team 2";
		}
		await Promise.all([
			Promise.all(team1Players.map(async (p) => {
			  await p.save().catch(console.error);
			})),
			Promise.all(team2Players.map(async (p) => {
			  await p.save().catch(console.error);
			}))
		  ]);
		if(match.map1Winner == "Team 1" && match.map2Winner == "Team 1" || 
		   match.map2Winner == "Team 1" && match.map3Winner == "Team 1" ||
		   match.map1Winner == "Team 1" && match.map3Winner == "Team 1") {
				match.matchWinner = "Team 1"
		   } else {
				match.matchWinner = "Team 2"
		   }
		match.save();
		saveMatchPlayers(match, team1Players, team2Players);
		if(match.matchWinner == "Team 1") {
			addWinnersBackToQueue(interaction, client, team1Players, guild, match);
		} else {
			addWinnersBackToQueue(interaction, client, team2Players, guild, match);
		}
		var players = team1Players.concat(team2Players);
		if(!guild.hideNameElo) {
			updateNames(interaction, client, players, guild);
		}
		updateRoles(interaction, client, players, guild);
		updateMatchEmbed(interaction, team1Players, team2Players, guild, match, playersWithPreviousRating);
		try {
			await QueuePlayer.deleteMany({matchMessageId: match.messageId});
		} catch(error) {
			mongoError(error as MongooseError);
			console.log(`There was an error removing the players from the queueplayers in the database.`);
		}
	} else {
		match.team1ReportedT1G1Rounds = 0;
		match.team1ReportedT1G2Rounds = 0;
		match.team1ReportedT1G3Rounds = 0;
		match.team1ReportedT2G1Rounds = 0;
		match.team1ReportedT2G2Rounds = 0;
		match.team1ReportedT2G3Rounds = 0;
		match.team2ReportedT1G1Rounds = 0;
		match.team2ReportedT1G2Rounds = 0;
		match.team2ReportedT1G3Rounds = 0;
		match.team2ReportedT2G1Rounds = 0;
		match.team2ReportedT2G2Rounds = 0;
		match.team2ReportedT2G3Rounds = 0;
		match.save();
		var matchButtonRow1 = createMatchButtonRow1(false, true, true);
		var matchButtonRow2 = createMatchButtonRow2(false, true, true);
		await interaction.message?.edit({
			components: [matchButtonRow1, matchButtonRow2]
		});
		await interaction.deferUpdate().catch(error => {
            console.log(error);
        });
	}
};

export const updateNames = async (interaction: ModalSubmitInteraction<CacheType>, client: Client, players: IPlayer[], guild: IGuild) => {
	var guildMemberQueries: Promise<GuildMember>[] = [];
	for (const wp of players) {
		if(!interaction.guild) return;
		guildMemberQueries.push(interaction.guild?.members.fetch(wp.discordId));
	}

	await Promise.all(guildMemberQueries).then(async (queryResults) => {
		for (const qr of queryResults) {
			var player = players.find(p => p.discordId == qr.user.id);
			const isAdmin = qr.permissions.has(PermissionsBitField.Flags.Administrator);
			if (!player) continue;
			if (player.discordId != interaction.guild?.ownerId && !isAdmin) {
				var nickname = '';
				// they don't have a nickname yet
				if(!qr.nickname) {
					nickname = `${qr.displayName}{${player.rating}}`;
				}
				// they have a nickname and its been updated before 
				else if(qr.nickname?.includes('{')) {
					var oldNickname = qr.nickname;
					var updatedNickname = oldNickname.split('{')[0];
					nickname = `${updatedNickname}{${player.rating}}`;
				}
				// they have a nickname and it hasn't been updated before 
				else {
					nickname = `${qr.nickname}{${player.rating}}`;
				}
				try {
					qr.setNickname(nickname);
				} catch(error) {
					console.log("Could not set nickname to " + nickname);
				}
			}
		}
	});
}

export const updateRoles = async (interaction: ModalSubmitInteraction<CacheType>, client: Client, players: IPlayer[], guild: IGuild) => {
	var guildMemberQueries: Promise<GuildMember>[] = [];
	for (const wp of players) {
		if(!interaction.guild) return;
		guildMemberQueries.push(interaction.guild?.members.fetch(wp.discordId));
	}

	await Promise.all(guildMemberQueries).then(async (queryResults) => {
		for (const qr of queryResults) {
			var player = players.find(p => p.discordId == qr.user.id);
			const isAdmin = qr.permissions.has(PermissionsBitField.Flags.Administrator);
			if (!player) continue;
			if (player.discordId != interaction.guild?.ownerId && !isAdmin) {
				var roleId = getRankRole(player, guild);
				var role = qr.guild.roles.cache.find(role => role.id === roleId);
				var memberRoles = qr.roles.cache.filter(role => 
					role.id === guild.bronzeRoleId || 
					role.id === guild.silverRoleId || 
					role.id === guild.goldRoleId || 
					role.id === guild.platinumRoleId || 
					role.id === guild.diamondRoleId);
				try {
					// remove there current ranked roles
					if (memberRoles.size > 0) {
						memberRoles.each(r => {
							qr.roles.remove(r);
						});
					}
					// add new ranked role
					if (role)
						qr.roles.add(role);
				} catch(error) {
					console.log("Could not set role to " + role);
				}
			}
		}
	});
}

export const addWinnersBackToQueue = async (interaction: ModalSubmitInteraction<CacheType>, client: Client, winningPlayers: IPlayer[], guild: IGuild, match: IMatch): Promise<void> => {
	// get the users waiting in the queue when the match ended
	const queueUsersQuery = QueuePlayer.find<IQueuePlayer>().and([{ messageId: match.queueId}, { matchMessageId: { $exists: false } }]);
	const winnersQueueUsersQuery = Player.find<IPlayer>().and([{
		  $or: [
			{ discordId: winningPlayers[0].discordId },
			{ discordId: winningPlayers[1].discordId },
			{ discordId: winningPlayers[2].discordId },
			{ discordId: winningPlayers[3].discordId },
		  ],
		},
	  ]);

	var queueEmbedMessage = await (client?.channels?.cache.get(guild.queueChannelId) as TextChannel).messages.fetch(match.queueId);
	const receivedEmbed = queueEmbedMessage.embeds[0];
    const queueEmbed = EmbedBuilder.from(receivedEmbed);
	const queueQuery = Queue.findOne<IQueue>({ messageId: match.queueId });

    Promise.all([queueUsersQuery, winnersQueueUsersQuery, queueQuery]).then(async (queryResults: [IQueuePlayer[], IPlayer[], IQueue | null]) => {
		var queuePlayers = queryResults[0];
		var winningPlayers = queryResults[1];
		var queue = queryResults[2];
		var updatedWinningPlayers: IQueuePlayer[] = [];
		var updatedQueuePlayers: IQueuePlayer[] = [];

		for (const wp of winningPlayers) {
			var queueRecord = null;
			var currentTime = new Date();
			try {
				queueRecord = await new QueuePlayer({
					discordId: wp.discordId,
					messageId: match.queueId,
					queueTime: currentTime
				}).save();
				if (queuePlayers.length > 8) {
					queueRecord.queuePosition = 0; // 0 means they will be added to the front starting at 1
				}
			} catch (error) {
				mongoError(error as MongooseError);
				console.log(`There was an error adding the player to the queue in the database.`);
				return;
			}
			updatedWinningPlayers.push(queueRecord);
		}

		updatedQueuePlayers = updatedWinningPlayers.concat(queuePlayers);
		await updateQueuePositions(updatedQueuePlayers);
		rebuildQueue(interaction as unknown as ButtonInteraction<CacheType>, queueEmbed, queueEmbedMessage, updatedQueuePlayers, guild, queue as IQueue, true)
    });
}

export const updateMatchEmbed = async (interaction: ModalSubmitInteraction<CacheType>, team1Players: IPlayer[], team2Players: IPlayer[], guild: IGuild, match: IMatch, playersWithPreviousRating: IPlayer[]): Promise<void> => {
	const receivedEmbed = interaction.message?.embeds[0];
	const matchEmbed = EmbedBuilder.from(receivedEmbed as Embed);
	var team1 = "";
    var team2 = "";
    var team1Total = 0;
    var team2Total = 0;
	var team1TotalDifference = 0;
	var team2TotalDifference = 0;
    var fields: Field[] = [];
    for (let i = 0; i < team1Players.length; i++) {
        var emoji = getRankEmoji(team1Players[i], guild);
		var playerPrevious = playersWithPreviousRating.find(p => p.discordId == team1Players[i].discordId);
		if(!playerPrevious) return;
		var ratingDifference = team1Players[i].rating - playerPrevious?.rating;
		team1TotalDifference += ratingDifference;
        team1Total += playerPrevious?.rating;
        team1 += `<@${team1Players[i].discordId}> ${emoji}${playerPrevious?.rating} (${ratingDifference})\n`;
    }
    for (let i = 0; i < team2Players.length; i++) {
        var emoji = getRankEmoji(team2Players[i], guild);
		var playerPrevious = playersWithPreviousRating.find(p => p.discordId == team2Players[i].discordId);
		if(!playerPrevious) return;
		var ratingDifference = team2Players[i].rating - playerPrevious?.rating;
		team2TotalDifference += ratingDifference;
        team2Total += playerPrevious?.rating;
        team2 += `<@${team2Players[i].discordId}> ${emoji}${playerPrevious?.rating} (${ratingDifference})\n`;
    }
    fields.push({name: `Maps`, value: `${match.map1}\n${match.map2}\n${match.map3}`, inline: false});
	fields.push({name: `Winner`, value: match.matchWinner, inline: false});
    fields.push({name: `Team 1(${team1Total}) (${team1TotalDifference})`, value: team1, inline: true});
    fields.push({name: `Team 2(${team2Total}) (${team2TotalDifference})`, value: team2, inline: true});
	matchEmbed.setFields(fields);
	await interaction.message?.edit({
        embeds: [matchEmbed],
        components: []
    });
	await interaction.deferUpdate().catch(error => {
		console.log(error);
	});
};


export const saveMatchPlayers = async (match: IMatch, team1Players: IPlayer[], team2Players: IPlayer[]) => {
	var matchPlayerRecord = null;
	var matchplayers = [];
	try {
		for (const player of team1Players) {
			matchplayers.push({
				discordId: player.discordId,
				matchMessageId: match.messageId,
				team: 1,
			});
		}
		for (const player of team2Players) {
			matchplayers.push({
				discordId: player.discordId,
				matchMessageId: match.messageId,
				team: 2,
			});
		}
		matchPlayerRecord = await MatchPlayer.insertMany(matchplayers);
	} catch (error) {
		mongoError(error as MongooseError);
		console.log(`There was an error adding the player to the matchplayers in the database.`);
		return;
	}
}
