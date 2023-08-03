import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitScoreModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'scoret1g1'
    },
    execute: (interaction, client: Client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted scoret1g1");
        submitScoreModal(interaction, client, 1, 1);
    },
    cooldown: 2
}

export default modal;