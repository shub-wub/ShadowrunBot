import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret2g1'
    },
    execute: async (interaction, client) => {
        scoreMatch(interaction, client, 2, 1);
    },
    cooldown: 2
}

export default button;