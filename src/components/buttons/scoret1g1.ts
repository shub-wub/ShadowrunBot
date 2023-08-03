import { scoreMatch } from '#operations';
import { Client } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret1g1'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed scoret1g1");
        scoreMatch(interaction, client, 1, 1);
    },
    cooldown: 2
}

export default button;