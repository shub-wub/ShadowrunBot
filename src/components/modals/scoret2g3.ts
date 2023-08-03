import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitScoreModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'scoret2g3'
    },
    execute: (interaction, client: Client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted scoret2g3");
        submitScoreModal(interaction, client, 2, 3);
    },
    cooldown: 2
}

export default modal;