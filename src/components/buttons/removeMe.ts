import { removeUserFromQueue } from '#operations';
import { Button } from 'src/types';

const button: Button = {
    data: {
        name: 'removeQueue'
    },
    execute: async (interaction, client) => {
        removeUserFromQueue(interaction, client);
    },
    //cooldown: 10
}

export default button;