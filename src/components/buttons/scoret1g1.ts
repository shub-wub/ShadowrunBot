import { scoreMatch } from '#operations';
import { Client } from 'discord.js';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret1g1'
    },
    execute: async (interaction, client) => {
        scoreMatch(interaction, client, 1, 1);
    },
    cooldown: 2
}

export default button;