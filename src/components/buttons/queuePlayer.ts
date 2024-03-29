import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'queuePlayer'
    },
    execute: async (interaction, client) => {
		const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed queuePlayer");
        const modal = new ModalBuilder()
		.setCustomId("player")
		.setTitle("Player")
		.addComponents([
            new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("playerInput")
					.setLabel("Player")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			]),
			new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("readyInput")
					.setLabel("Ready")
					.setRequired(true)
					.setValue("false")
					.setStyle(TextInputStyle.Short),
			]),
		]);

	interaction.showModal(modal);
    },
    //cooldown: 2
}

export default button;