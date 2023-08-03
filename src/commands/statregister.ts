import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { statRegister } from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("statregister")
        .setDescription("Register your profile for ranked play and stat tracking.")
        .addUserOption(option =>
            option
                .setName('discorduser')
                .setDescription('The discord user you want to add to the database.')
                .setRequired(true)
        ),
    execute: (interaction, client) => {
        statRegister(interaction);
    },
    //cooldown: 10
}

export default command;