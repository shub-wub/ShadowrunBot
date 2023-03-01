import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { leaderboard } from "#operations";
import Player from '../schemas/player';

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Print out leaderboard stats")
        .addStringOption(option =>
            option
                .setName('device')
                .setDescription('Enter either "pc" or "mobile"')
                .setRequired(true)
        ),
    execute: async (interaction: CommandInteraction, client: Client) => {
        // Retrieve the players from the database and sort by rating
        const players = await Player.find().sort('-rating');
        const playersPerPage = 10;
        var device: string = (interaction.options as any).getString("device");
        await leaderboard(interaction, client, players, playersPerPage, device.toLowerCase());
    },
    cooldown: 10
}

export default command;