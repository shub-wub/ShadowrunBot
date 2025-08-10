import { Modal } from "../../types";
import { ButtonInteraction, Client } from 'discord.js';
import { processQueue, removeUserFromQueue } from "#operations";

const modal : Modal = {
    data: {
        name: 'removePlayer'
    },
    execute: (interaction, client: Client) => {
        var playerId = interaction.fields.getTextInputValue("playerInput");
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted 'Remove Player' for " + playerId);
        removeUserFromQueue(interaction as unknown as ButtonInteraction, playerId);
    },
    //cooldown: 10
}

export default modal;