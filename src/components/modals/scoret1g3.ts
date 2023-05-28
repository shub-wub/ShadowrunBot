import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitScoreModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'scoret1g3'
    },
    execute: (interaction, client: Client) => {
        submitScoreModal(interaction, client, 1, 3);
    },
    //cooldown: 10
}

export default modal;