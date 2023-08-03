import { processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'readyup'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed readyup");
        processQueue(interaction, client, true);
    },
    cooldown: 1
}

export default button;