import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret1g3'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed scoret1g3");
        scoreMatch(interaction, client, 1, 3);
    },
    cooldown: 2
}

export default button;