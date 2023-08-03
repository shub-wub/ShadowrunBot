import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret2g3'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed scoret2g3");
        scoreMatch(interaction, client, 2, 3);
    },
    cooldown: 2
}

export default button;