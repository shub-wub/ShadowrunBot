import { processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'readyup'
    },
    execute: async (interaction, client) => {
        processQueue(interaction, client, true);
    },
    //cooldown: 3
}

export default button;