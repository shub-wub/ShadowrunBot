import { Modal } from "src/types";

const {EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

const modal : Modal = {
    data: {
        name: 'queue'
    },
    execute: async (interaction, client) => {
        await interaction.reply({
            content: "pushed"
        });

        const embed = new EmbedBuilder()
        .setCustomId()
        .setTitle('Queue')
        .setDescription("Click queue if you are ready to join a lobby and play right now. When 8 players have joined the queue teams will be created.")
        .setColor(0x18e1ee)
        .addFields([
            {
                name: `MatchCount`,
                value: '0',
                inline: false
            },
            {
                name: `Queue`,
                value: `+`,
                inline: false
            }
        ]);
        const activeButtonRow1 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('queue')
                    .setLabel('Queue')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('queue-player')
                    .setLabel('Queue Player')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('removeQueue')
                    .setLabel('Remove Me')
                    .setStyle(ButtonStyle.Danger),
                ]);
        const activeButtonRow2 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('requeue')
                    .setLabel('Requeue')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('readyup')
                    .setLabel('Ready Up')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ready-player')
                    .setLabel('Ready Up Player')
                    .setStyle(ButtonStyle.Secondary),
                ]);
        const activeButtonRow3 = new ActionRowBuilder()
            .addComponents([
                new ButtonBuilder()
                    .setCustomId('score-match')
                    .setLabel('Score Match')
                    .setStyle(ButtonStyle.Danger)
                ]);

        await interaction.reply({
            embeds: [embed], 
            components: [activeButtonRow1, activeButtonRow2, activeButtonRow3]
        });
    },
    cooldown: 10
}

export default modal;