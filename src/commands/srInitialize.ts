import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { srinitialize } from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("srinitialize")
        .setDescription("Use once to initialize the Shadowrun Bot."),
    execute: async (interaction: CommandInteraction, client: Client) => {
        srinitialize(interaction);
    }
}

export default command;