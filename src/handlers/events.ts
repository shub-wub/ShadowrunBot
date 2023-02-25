import { Client } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { color } from "#utilities";
import { BotEvent } from "../types";

export function eventsHandler(client: Client) {
    let eventsDir = join(__dirname, "../events")
    readdirSync(eventsDir).forEach(file => {
        if (!file.endsWith(".js")) return;
        let event: BotEvent = require(`${eventsDir}/${file}`).default;
        event.once ?
            client.once(event.name, (...args) => event.execute(...args, client))
            :
            client.on(event.name, (...args) => event.execute(...args, client));
        console.log(color("text", `🌠 Successfully loaded event ${color("variable", event.name)}`));
    })
}
