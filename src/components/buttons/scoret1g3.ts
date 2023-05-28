import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret1g3'
    },
    execute: async (interaction, client) => {
        scoreMatch(interaction, client, 1, 3);
    },
    //cooldown: 10
}

export default button;