import { scoreMatch } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'scoret2g2'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed scoret2g2");
        scoreMatch(interaction, client, 2, 2);
    },
    cooldown: 2
}

export default button;