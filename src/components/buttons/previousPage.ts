import { pageButton } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'previous'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed previous");
        pageButton(interaction, "previous");
    },
    cooldown: 1
}

export default button;