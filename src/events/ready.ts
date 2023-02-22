import { Client } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: 'ready',
    once: true,
    async execute(client: Client) {
        client.user?.setUsername("ShadowrunBotTS");
        console.log(`Ready!!! ${client.user?.tag} is logged in and online.`);
    }
}

export default event;