import { joinQueue } from '#operations';
import { Button } from 'src/types';

const button : Button = {
    data: {
        name: 'queue'
    },
    execute: async (interaction, client) => {
        joinQueue(interaction);
    },
    //cooldown: 10
}

export default button;