import { Modal } from "../../types";
import { ButtonInteraction, Client } from 'discord.js';
import { processQueue } from "#operations";

const modal : Modal = {
    data: {
        name: 'player'
    },
    execute: (interaction, client: Client) => {
        var player = interaction.fields.getTextInputValue("playerInput");
        var playerByUsername = interaction.guild?.members.cache.find(gm => gm.user.username == player);
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + " " + interaction.user.username + " submitted player");
        processQueue(interaction as unknown as ButtonInteraction, client, playerByUsername?.user.id as string);
    },
    //cooldown: 10
}

export default modal;