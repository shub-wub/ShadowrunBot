import { config } from "dotenv";
config();
const { token } = process.env;
import { Client, Collection/*, Partials */} from "discord.js";
import { SlashCommand, Button, SelectMenu, Modal } from "./types";
import { eventsHandler, commandHandler, componentHandler, mongoHandler } from "#handlers";

const client = new Client({ intents: 32767/*, partials: [Partials.Message, Partials.Channel] */}); // add in all intents and partials
client.commands = new Collection<string, SlashCommand>();
client.buttons = new Collection<string, Button>();
client.selectMenus = new Collection<string, SelectMenu>();
client.modals = new Collection<string, Modal>();
client.cooldowns = new Collection<string, number>();
client.commandArray = [];

eventsHandler(client);
commandHandler(client);
componentHandler(client);
mongoHandler();
client.login(token);