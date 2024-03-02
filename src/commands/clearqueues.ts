
import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import { isGmOrBetter } from "#operations";
import { openClearQueuesModal } from "#operations";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("clearqueues")
		.setDescription("Clear all of the players from the ranked queues"),
	execute: async (interaction: CommandInteraction, client: Client) => {
        var canClear = await isGmOrBetter(interaction);
		if (!canClear) {
			await interaction.reply({ content: "Only a GM+ may clear the queues.", ephemeral: true });
		}
		else {
			openClearQueuesModal(interaction);
		}
	},
	cooldown: 1,
};

export default command;
