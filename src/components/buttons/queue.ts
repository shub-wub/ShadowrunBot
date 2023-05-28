import { processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'queue'
    },
    execute: async (interaction, client) => {
        processQueue(interaction, client, false);
    },
    //cooldown: 10
}

export default button;