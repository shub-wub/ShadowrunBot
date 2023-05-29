import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret1g2'
    },
    execute: async (interaction, client) => {
        scoreMatch(interaction, client, 1, 2);
    },
    cooldown: 2
}

export default button;