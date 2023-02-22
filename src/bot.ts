import { config } from "dotenv";
config();
const { token } = process.env;
import { Client, Collection } from "discord.js";
import { SlashCommand, Button, SelectMenu, Modal } from "./types";
import { readdirSync } from 'fs';
import { join } from "path";

const client = new Client({ intents: 32767 }); // add in all intents
client.commands = new Collection<string, SlashCommand>();
client.buttons = new Collection<string, Button>();
client.selectMenus = new Collection<string, SelectMenu>();
client.modals = new Collection<string, Modal>();
client.cooldowns = new Collection<string, number>();
client.commandArray = [];

const handlersDir = join(__dirname, "./handlers");

readdirSync(handlersDir).forEach(handler => {
    require(`${handlersDir}/${handler}`)(client);
});

client.login(token);