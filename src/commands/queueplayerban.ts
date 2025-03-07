import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { toggleQueuePlayerBan } from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("togglequeueplayerban")
        .setDescription("Register your profile for ranked play and stat tracking.")
        .addStringOption(option =>
            option
                .setName('queueid')
                .setDescription('The queue you want to ban a player from.')
                .setRequired(true)
        )
        .addUserOption(option =>
            option
                .setName('playerid')
                .setDescription('The discord user you want to ban from the queue.')
                .setRequired(true)
        ),
    execute: (interaction, client) => {
        toggleQueuePlayerBan(interaction);
    },
    //cooldown: 10
}

export default command;