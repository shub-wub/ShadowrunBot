import { ButtonInteraction, Client } from "discord.js";
import QueuePlayer from "#schemas/queuePlayer";
import Match from "#schemas/match";
import { IQueuePlayer, IMatch } from "../../types";
import { openScoreModal } from "#operations";

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