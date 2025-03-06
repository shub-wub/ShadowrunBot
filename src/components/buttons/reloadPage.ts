import { pageButton } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'reload'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed reload leaderboard");
        pageButton(interaction, "reload");
    },
    cooldown: 1
}

export default button;
