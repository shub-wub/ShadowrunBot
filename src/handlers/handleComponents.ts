import { readdirSync } from 'fs';
import { Client } from "discord.js";
import { join } from 'path';

module.exports = (client: Client) => {

    let componentDir = join(__dirname,"../components");
    console.log(componentDir);

    readdirSync(componentDir).forEach(folder => {
        if (!folder) return;
        let componentSubDir = join(componentDir, folder);
        readdirSync(componentSubDir).forEach(file => {
            if (!file.endsWith(".js")) return;
            const { buttons, selectMenus, modals } = client;

            switch (folder) {
                case "buttons":
                    const button = require(`../../components/${folder}/${file}`);
                    buttons.set(button.data.name, button);
                    break;
                case "selectMenus":
                    const menu = require(`../../components/${folder}/${file}`);
                    selectMenus.set(menu.data.name, menu);
                    break;
                case "modals":
                    const modal = require(`../../components/${folder}/${file}`);
                    modals.set(modal.data.name, modal);
                    break;
                default:
                    break;
            }
        });
    });
}