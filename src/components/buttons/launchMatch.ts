import { createMatch, isGmOrBetter, launchMatch, processQueue } from '#operations';
import { Button } from '../../types';

const button: Button = {
    data: {
        name: 'launchMatch'
    },
    execute: async (interaction, client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " pushed launchMatch");
        var canLaunch = await isGmOrBetter(interaction);
        if (!canLaunch) {
            await interaction.reply({
                content: `Contact a GM or staff member to launch the match`,
                ephemeral: true
            });
            return;
        } else {
            launchMatch(interaction, client);
        }
    },
    cooldown: 10
}

export default button;