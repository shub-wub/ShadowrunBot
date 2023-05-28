import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitScoreModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'scoret1g2'
    },
    execute: (interaction, client: Client) => {
        submitScoreModal(interaction, client, 1, 2);
    },
    //cooldown: 10
}

export default modal;