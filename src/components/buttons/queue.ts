import { processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'queue'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed queue");
        processQueue(interaction, client);
    },
    cooldown: 1
}

export default button;