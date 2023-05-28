import { removeUserFromQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'removeQueue'
    },
    execute: async (interaction, client) => {
        removeUserFromQueue(interaction);
    },
    //cooldown: 10
}

export default button;