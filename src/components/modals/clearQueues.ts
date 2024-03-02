import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitClearQueuesModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'clearQueues'
    },
    execute: (interaction, client: Client) => {
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted clearQueues");
        submitClearQueuesModal(interaction, client);
    },
    //cooldown: 10
}

export default modal;