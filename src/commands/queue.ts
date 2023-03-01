import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { openQueueModal } from "#operations";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Create a queue"),
    execute: (interaction, client) => {
        openQueueModal(interaction);
    },
    cooldown: 10
}

export default command;