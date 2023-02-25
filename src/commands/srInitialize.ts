import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { srInitialize } from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("srinitialize")
        .setDescription("Use once to initialize the Shadowrun Bot."),
    execute: async (interaction: CommandInteraction, client: Client) => {
        srInitialize(interaction);
    }
}

export default command;