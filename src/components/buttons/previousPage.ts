import { pageButton } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'previous'
    },
    execute: async (interaction, client) => {
        pageButton(interaction, "previous");
    },
    //cooldown: 10
}

export default button;