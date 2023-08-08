import { createMatch, launchMatch, processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'launchMatch'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed launchMatch");
        launchMatch(interaction, client);
    },
    cooldown: 10
}

export default button;