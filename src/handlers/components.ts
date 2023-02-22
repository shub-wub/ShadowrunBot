import { readdirSync } from 'fs';
import { Client } from "discord.js";
import { join } from 'path';
import { Button, Modal, SelectMenu } from 'src/types';

export function componentHandler(client: Client) {
    let componentDir = join(__dirname,"../components");
    readdirSync(componentDir).forEach(folder => {
        if (!folder) return;
        let componentSubDir = join(componentDir, folder);
        readdirSync(componentSubDir).forEach(file => {
            if (!file.endsWith(".js")) return;
            const { buttons, selectMenus, modals } = client;
            switch (folder) {
                case "buttons":
                    const button: Button = require(`../components/${folder}/${file}`).default;
                    buttons.set(button.data.name, button);
                    break;
                case "selectMenus":
                    const menu: SelectMenu = require(`../components/${folder}/${file}`).default;
                    selectMenus.set(menu.data.name, menu);
                    break;
                case "modals":
                    const modal: Modal = require(`../components/${folder}/${file}`).default;
                    modals.set(modal.data.name, modal);
                    break;
                default:
                    break;
            }
        });
    });
}