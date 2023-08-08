import { removeUserFromQueue } from '#operations';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'removePlayer'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed removePlayer");
        const modal = new ModalBuilder()
		.setCustomId("removePlayer")
		.setTitle("Player")
		.addComponents([
            new ActionRowBuilder<TextInputBuilder>().addComponents([
				new TextInputBuilder()
					.setCustomId("playerInput")
					.setLabel("Player")
					.setRequired(true)
					.setStyle(TextInputStyle.Short),
			])
		]);

	    interaction.showModal(modal);
    },
    cooldown: 2
}

export default button;