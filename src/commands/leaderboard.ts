import {SlashCommandBuilder} from "discord.js";
import {SlashCommand} from "../types";
import {leaderboard} from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Print out leaderboard stats"),
    execute: async (interaction) => {
        await leaderboard(interaction);
    },
    cooldown: 10
}

export default command;