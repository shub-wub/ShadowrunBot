import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'readyUpPlayer'
    },
    execute: async (interaction, client) => {
		const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed readyUpPlayer");
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
					.setValue("true")
					.setStyle(TextInputStyle.Short),
			]),
		]);

	interaction.showModal(modal);
    },
    //cooldown: 2
}

export default button;