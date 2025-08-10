import { removeUserFromQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'removeQueue'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed 'Remove Me'");
        removeUserFromQueue(interaction);
    },
    //cooldown: 2
}

export default button;