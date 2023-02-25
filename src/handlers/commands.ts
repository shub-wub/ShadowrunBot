import { Client, Routes } from "discord.js";
import { REST } from "@discordjs/rest"
import { readdirSync } from "fs";
import { join } from "path";
import { color } from "#utilities";
import { SlashCommand } from "../types";
const { token, clientId, guildId } = process.env;

export function commandHandler(client: Client) {
    let slashCommandsDir = join(__dirname,"../commands");
    readdirSync(slashCommandsDir).forEach(file => {
        if (!file.endsWith(".js")) return;
        let command : SlashCommand = require(`${slashCommandsDir}/${file}`).default;
        const { commands, commandArray } = client;
        commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
    });

    const rest = new REST({version: "10"}).setToken(token);

    rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: client.commandArray
    })
    .then((data : any) => {
        console.log(color("text", `🔥 Successfully loaded ${color("variable", data.length)} slash command(s)`));
    }).catch(e => {
        console.log(e);
    });
}