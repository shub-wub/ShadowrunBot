import { getQueuePlayers, getQueuePlayersAsText, isGmOrBetter } from '#operations';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'removePlayer'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed removePlayer");
        var queuePlayersQuery = getQueuePlayers(interaction);
        var userRoleQuery = isGmOrBetter(interaction);
        Promise.all([queuePlayersQuery, userRoleQuery]).then(async (queryResults) => {
            if (!queryResults[1]) {
                await interaction.reply({
                    content: `Only a GM or staff member can remove a player. If someone hasn't joined within the time limit contact a GM or staff member.`,
                    ephemeral: true
                });
                return;
            }
            var queuePlayersAsText = await getQueuePlayersAsText(interaction, queryResults[0]);
            const modal = new ModalBuilder()
            .setCustomId("removePlayer")
            .setTitle("Player")
            .addComponents([
                new ActionRowBuilder<TextInputBuilder>().addComponents([
                    new TextInputBuilder()
                        .setCustomId("playerList")
                        .setLabel("Players")
                        .setValue(queuePlayersAsText)
                        .setStyle(TextInputStyle.Paragraph),
                ]),
                new ActionRowBuilder<TextInputBuilder>().addComponents([
                    new TextInputBuilder()
                        .setCustomId("playerInput")
                        .setLabel("Player")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short),
                ])
            ]);

	        interaction.showModal(modal);
        });
    },
    cooldown: 2
}

export default button;