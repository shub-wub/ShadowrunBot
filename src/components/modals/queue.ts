import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitQueueModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'queue'
    },
    execute: (interaction, client: Client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted queue");
        submitQueueModal(interaction, client);
    },
    //cooldown: 10
}

export default modal;