import { Modal } from "../../types";
import { Client } from 'discord.js';
import { submitScoreModal } from "#operations";

const modal : Modal = {
    data: {
        name: 'scoret2g3'
    },
    execute: (interaction, client: Client) => {
        submitScoreModal(interaction, client, 2, 3);
    },
    cooldown: 2
}

export default modal;