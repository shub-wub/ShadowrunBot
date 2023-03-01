import { CacheType, ButtonInteraction} from "discord.js";
import { createLeaderboardButtonRow, createLeaderboardEmbed } from "#operations";
import Player from '../../schemas/player';

export const pageButton = async (interaction: ButtonInteraction<CacheType>, direction: string): Promise<void> => {
    // Retrieve the players from the database and sort by rating
    const players = await Player.find().sort('-rating');
    const playersPerPage = 10;
    const receivedEmbed = interaction.message.embeds[0];
    var pageNumber = Number(receivedEmbed.fields[0].value);
    var device = receivedEmbed.fields[1].value;
    if(direction == "previous")
        pageNumber--;
    else if(direction == "next")
        pageNumber++;
    const newEmbed = createLeaderboardEmbed(pageNumber, players, playersPerPage, device);
    const newButtonRow = createLeaderboardButtonRow(pageNumber, players, playersPerPage);
    await interaction.update({ embeds: [newEmbed], components: [newButtonRow] });
}