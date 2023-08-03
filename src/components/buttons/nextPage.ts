import { pageButton } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'next'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed next");
        pageButton(interaction, "next");
    },
    cooldown: 2
}

export default button;