import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitQueueModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'queue'
    },
    execute: (interaction, client: Client) => {
        submitQueueModal(interaction, client);
    },
    //cooldown: 10
}

export default modal;