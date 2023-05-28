import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CacheType,
	Client,
	CommandInteraction,
	Embed,
	EmbedBuilder,
	MessageActionRowComponentBuilder,
	ModalBuilder,
	ModalSubmitInteraction,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { getThemeColor, mongoError } from "#utilities";
import { Field, IGuild, IMap, IMatch, IPlayer, IQueuePlayer } from "../../types";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import QueuePlayer from "#schemas/queuePlayer";
import Match from "#schemas/match";
import Map from "#schemas/map";
import { MongooseError } from "mongoose";
import { calculateTeamElo, createMatchButtonRow1, createMatchButtonRow2, getRankEmoji } from "#operations";

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
	const guildQuery = Guild.findOne<IGuild>({ guildId: interaction.guildId });
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
					await interaction.deferUpdate();
				} else {
					match.team2ReportedT1G1Rounds = team1RoundsWon;
					match.team2ReportedT2G1Rounds = team2RoundsWon;
					match.save();
					var matchButtonRow2 = createMatchButtonRow2(true, false, true);
					await interaction.message?.edit({
						components: [interaction.message?.components[0], matchButtonRow2]
					});
					await interaction.deferUpdate();
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
				if ((match.team1ReportedT1G2Rounds > 0 || match.team1ReportedT2G3Rounds > 0) &&
					(match.team2ReportedT1G2Rounds > 0 || match.team2ReportedT2G3Rounds > 0) &&
					match.team1ReportedT1G1Rounds == match.team2ReportedT1G1Rounds && 
					match.team1ReportedT1G2Rounds == match.team2ReportedT1G2Rounds && 
					(match.team1ReportedT1G1Rounds == 6 && match.team1ReportedT1G2Rounds == 6 ||
					match.team1ReportedT2G1Rounds == 6 && match.team1ReportedT2G2Rounds == 6 )) {
						finalizeMatch(interaction, team1Players, team2Players, guild, match);
					} else {
						await interaction.deferUpdate();
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
					finalizeMatch(interaction, team1Players, team2Players, guild, match);
				} else {
					match.save();
					await interaction.deferUpdate();
				}
				break;
		}
    });
}

export const finalizeMatch = async (interaction: ModalSubmitInteraction<CacheType>, team1Players: IPlayer[], team2Players: IPlayer[], guild: IGuild, match: IMatch): Promise<void> => {
	// if both teams scores match for all rounds
	if (match.team1ReportedT1G1Rounds == match.team2ReportedT1G1Rounds && 
		match.team1ReportedT1G2Rounds == match.team2ReportedT1G2Rounds && 
		match.team1ReportedT1G3Rounds == match.team2ReportedT1G3Rounds &&
		match.team1ReportedT2G1Rounds == match.team2ReportedT2G1Rounds && 
		match.team1ReportedT2G2Rounds == match.team2ReportedT2G2Rounds && 
		match.team1ReportedT2G3Rounds == match.team2ReportedT2G3Rounds) {
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
		team1Players.forEach(async p => {
            await p.save().catch(console.error);
        });
        team2Players.forEach(async p => {
            await p.save().catch(console.error);
        });
		if(match.map1Winner == "Team 1" && match.map2Winner == "Team 1" || 
		   match.map2Winner == "Team 1" && match.map3Winner == "Team 1" ||
		   match.map1Winner == "Team 1" && match.map3Winner == "Team 1") {
				match.matchWinner = "Team 1"
		   } else {
				match.matchWinner = "Team 2"
		   }
		match.save();
		updateMatchEmbed(interaction, team1Players, team2Players, guild, match)
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
		await interaction.deferUpdate();
	}
};

export const updateMatchEmbed = async (interaction: ModalSubmitInteraction<CacheType>, team1Players: IPlayer[], team2Players: IPlayer[], guild: IGuild, match: IMatch): Promise<void> => {
	const receivedEmbed = interaction.message?.embeds[0];
	const matchEmbed = EmbedBuilder.from(receivedEmbed as Embed);
	var team1 = "";
    var team2 = "";
    var team1Total = 0;
    var team2Total = 0;
    var fields: Field[] = [];
    for (let i = 0; i < team1Players.length; i++) {
        var emoji = getRankEmoji(team1Players[i], guild);
        team1Total += team1Players[i].rating;
        team1 += `<@${team1Players[i].discordId}> ${emoji}${team1Players[i].rating}\n`;
    }
    for (let i = 0; i < team2Players.length; i++) {
        var emoji = getRankEmoji(team2Players[i], guild);
        team2Total += team2Players[i].rating;
        team2 += `<@${team2Players[i].discordId}> ${emoji}${team2Players[i].rating}\n`;
    }
    fields.push({name: `Maps`, value: `${match.map1}\n${match.map2}\n${match.map3}`, inline: false});
	fields.push({name: `Winner`, value: match.matchWinner, inline: false});
    fields.push({name: `Team 1(${team1Total})`, value: team1, inline: true});
    fields.push({name: `Team 2(${team2Total})`, value: team2, inline: true});
	matchEmbed.setFields(fields);
	await interaction.message?.edit({
        embeds: [matchEmbed],
        components: []
    });
    await interaction.deferUpdate();
};
