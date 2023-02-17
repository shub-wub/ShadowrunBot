import { SlashCommandBuilder, CommandInteraction, Collection, PermissionResolvable, Message, AutocompleteInteraction, ModalSubmitInteraction, ButtonInteraction, AnySelectMenuInteraction } from "discord.js"
import mongoose from "mongoose"

export interface SlashCommand {
    commandBuilder: SlashCommandBuilder | any,
    execute: (interaction: CommandInteraction, client: Client) => void,
    autocomplete?: (interaction: AutocompleteInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface Button {
    command: string,
    execute: (interaction: ButtonInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface SelectMenu {
    command: string,
    execute: (interaction: AnySelectMenuInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface Modal {
    command: string,
    execute: (interaction: ModalSubmitInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface IPlayer extends mongoose.Document {
    discordId: Number,
    discordUsername: String,
    gamertag: String,
    rating: Number,
    wins: Number,
    losses: Number,
    kills: Number,
    deaths: Number,
    resurrects: Number,
    bonusTotal: Number,
    friendlyFire: Number
}

interface GuildOptions {
    prefix: string,
}

export interface IGuild extends mongoose.Document {
    guildID: string,
    options: GuildOptions
    joinedAt: Date
}

export type GuildOption = keyof GuildOptions
export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args?) => void
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            token: string,
            clientId: string,
            prefix: string,
            databaseToken: string,
            guildId: string
        }
    }
}

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, SlashCommand>
        buttons: Collection<string, Button>
        selectMenus: Collection<string, SelectMenu>
        modals: Collection<string, Modal>
        cooldowns: Collection<string, number>
        commandArray: Array<string>
    }
}