import { Client, Routes, SlashCommandBuilder } from "discord.js";
import { REST } from "@discordjs/rest"
import { readdirSync } from "fs";
import { join } from "path";
import { color } from "../functions";
import { SlashCommand } from "../types";
const { token, clientId, guildId } = process.env;

module.exports = (client: Client) => {
    //const slashCommands: SlashCommandBuilder[] = [];

    const { commands, commandArray } = client;

    let slashCommandsDir = join(__dirname,"../commands");

    readdirSync(slashCommandsDir).forEach(file => {
        if (!file.endsWith(".js")) return;
        let command : SlashCommand = require(`${slashCommandsDir}/${file}`).default;
        commands.set(command.commandBuilder.name, command);
        commandArray.push(command.commandBuilder.toJSON());
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