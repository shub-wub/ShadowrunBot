import { Interaction, InteractionType, Client } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: 'interactionCreate',
    async execute(interaction: Interaction, client: Client) {
        if (interaction.isChatInputCommand()) {
            const { commands, cooldowns } = client;
            const { commandName, user } = interaction;
            const command = commands.get(commandName);
            const type = "SlashCommand";
            let cooldown = cooldowns.get(`${commandName}-${type}-${user.username}`);
            if (!command) {
                console.error(`No command matching ${commandName} was found.`);
                return;
            }
            if (command.cooldown && cooldown) {
                // if (Date.now() < cooldown) {
                //     await interaction.reply({
                //         content: `You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this command again.`,
                //         ephemeral: true
                //     });
                //     setTimeout(() => interaction.deleteReply(), 5000);
                //     return
                // }
                cooldowns.set(`${commandName}-${type}-${user.username}`, Date.now() + command.cooldown * 1000);
                setTimeout(() => {
                    cooldowns.delete(`${commandName}-${type}-${user.username}`)
                }, command.cooldown * 1000);
            } else if (command.cooldown && !cooldown) {
                cooldowns.set(`${commandName}-${type}-${user.username}`, Date.now() + command.cooldown * 1000);
            }
            try {
                command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: `Something went wrong while executing this command...`,
                    ephemeral: true
                });
            }
        } else if (interaction.isButton()) {
            const { buttons, cooldowns } = client;
            const { customId, user } = interaction;
            const button = buttons.get(customId);
            const type = "Button";
            //let cooldown = cooldowns.get(`${customId}-${type}-${user.username}`);
            let cooldown = cooldowns.get(`${customId}-${type}`);
            if (!button) {
                console.error(`There is no code for this button.`);
                return;
            }
            if (button.cooldown && cooldown) {
                // if (Date.now() < cooldown) {
                //     await interaction.reply({
                //         content: `You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this button again.`,
                //         ephemeral: true
                //     });
                //     setTimeout(() => interaction.deleteReply(), 5000);
                //     return
                // }
                //cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + button.cooldown * 1000);
                cooldowns.set(`${customId}-${type}`, Date.now() + button.cooldown * 1000);
                setTimeout(() => {
                    //cooldowns.delete(`${customId}-${type}-${user.username}`)
                    cooldowns.delete(`${customId}-${type}`)
                }, button.cooldown * 1000);
            } else if (button.cooldown && !cooldown) {
                //cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + button.cooldown * 1000);
                cooldowns.set(`${customId}-${type}`, Date.now() + button.cooldown * 1000);
            }

            try {
                button.execute(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isStringSelectMenu()) {
            const { selectMenus, cooldowns } = client;
            const { customId, user } = interaction;
            const menu = selectMenus.get(customId);
            const type = "Menu";
            let cooldown = cooldowns.get(`${customId}-${type}-${user.username}`);
            if (!menu) {
                console.error(`There is no code for this select menu.`);
                return;
            }
            if (menu.cooldown && cooldown) {
                // if (Date.now() < cooldown) {
                //     await interaction.reply({
                //         content: `You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this menu again.`,
                //         ephemeral: true
                //     });
                //     setTimeout(() => interaction.deleteReply(), 5000);
                //     return
                // }
                cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + menu.cooldown * 1000);
                setTimeout(() => {
                    cooldowns.delete(`${customId}-${type}-${user.username}`)
                }, menu.cooldown * 1000);
            } else if (menu.cooldown && !cooldown) {
                cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + menu.cooldown * 1000);
            }

            try {
                menu.execute(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.type == InteractionType.ModalSubmit) {
            const { modals, cooldowns } = client;
            const { customId, user } = interaction;
            const modal = modals.get(customId);
            const type = "Modal";
            let cooldown = cooldowns.get(`${customId}-${type}-${user.username}`);
            if (!modal) {
                console.error(`There is no code for this modal`);
                return;
            }
            if (modal.cooldown && cooldown) {
                // if (Date.now() < cooldown) {
                //     await interaction.reply({
                //         content: `You have to wait ${Math.floor(Math.abs(Date.now() - cooldown) / 1000)} second(s) to use this modal again.`,
                //         ephemeral: true
                //     });
                //     setTimeout(() => interaction.deleteReply(), 5000);
                //     return
                // }
                cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + modal.cooldown * 1000);
                setTimeout(() => {
                    cooldowns.delete(`${customId}-${type}-${user.username}`)
                }, modal.cooldown * 1000);
            } else if (modal.cooldown && !cooldown) {
                cooldowns.set(`${customId}-${type}-${user.username}`, Date.now() + modal.cooldown * 1000);
            }

            try {
                modal.execute(interaction, client);
            } catch (error) {
                console.error(error);
            }
        } else if (interaction.isContextMenuCommand()) {
            const { commands } = client;
            const { commandName } = interaction;
            const contextCommand = commands.get(commandName);
            if (!contextCommand) {
                console.error(`No contextCommand matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                contextCommand.execute(interaction, client);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: `Something went wrong while executing this command...`,
                    ephemeral: true
                });
            }
        } else if (interaction.isAutocomplete()) {
            const { commands } = client;
            const { commandName } = interaction;
            const command = commands.get(commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                if(!command.autocomplete) return;
                command.autocomplete(interaction, client);
            } catch (error) {
                console.error(error);
            }
        }
    },
};

export default event;