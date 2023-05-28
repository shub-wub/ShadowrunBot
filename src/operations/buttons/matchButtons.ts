import { getThemeColor, mongoError } from "#utilities";
import {
	CacheType,
	ButtonInteraction,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageActionRowComponentBuilder,
    Client,
    TextChannel,
} from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Player from "#schemas/player";
import Guild from "#schemas/guild";
import Queue from "#schemas/queue";
import Match from "#schemas/match";
import Map from "#schemas/map";
import { Field, IGuild, IPlayer, IQueue, IQueuePlayer, IMap, IMatch } from "../../types";
import { MongooseError } from "mongoose";
import { generateTeams, getRankEmoji, openScoreModal } from "#operations";

export const scoreMatch = (interaction: ButtonInteraction, client: Client, team: number, game: number): void => {
    const matchQuery = Match.findOne<IMatch>({ messageId: interaction.message.id });
    const matchPlayersQuery = QueuePlayer.find<IQueuePlayer>({ matchMessageId: interaction.message.id });
    Promise.all([matchQuery, matchPlayersQuery])
        .then(async (queryResults: [IMatch | null, IQueuePlayer[]]) => {
            var playerReporting = queryResults[1].find(p => p.discordId == interaction.user.id);
            if(!playerReporting) {
                await interaction.reply({
                    content: `Only a player in the match can score it.`,
                    ephemeral: true
                });
                return;
            }
            if(playerReporting.team != team) {
                await interaction.reply({
                    content: `Only a player on team ${team} can score the match for team ${team}.`,
                    ephemeral: true
                });
                return;
            }
            openScoreModal(interaction, team, game);
            
    });
};