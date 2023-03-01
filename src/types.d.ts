import { SlashCommandBuilder, CommandInteraction, Collection, PermissionResolvable, Message, AutocompleteInteraction, ModalSubmitInteraction, ButtonInteraction, AnySelectMenuInteraction, ModalBuilder } from "discord.js"
import mongoose from "mongoose"

/*-----------------------------------------------------------------------------------------------
        Process Types
-------------------------------------------------------------------------------------------------*/
declare module "discord.js" {
    export interface Client {
        commands: Collection<string, SlashCommand>,
        buttons: Collection<string, Button>,
        selectMenus: Collection<string, SelectMenu>,
        modals: Collection<string, Modal>,
        cooldowns: Collection<string, number>,
        commandArray: Array<string>
    }
}

export interface BotEvent {
    name: string,
    once?: boolean | false,
    execute: (...args?) => void
}

export interface SlashCommand {
    data: SlashCommandBuilder | any,
    execute: (interaction: CommandInteraction, client: Client) => void,
    autocomplete?: (interaction: AutocompleteInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface Button {
    data: Component,
    execute: (interaction: ButtonInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface SelectMenu {
    data: Component,
    execute: (interaction: AnySelectMenuInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface Modal {
    data: Component,
    execute: (interaction: ModalSubmitInteraction, client: Client) => void,
    cooldown?: number // in seconds
}

export interface Component {
    name: string
}

/*-----------------------------------------------------------------------------------------------
        Utility Types
-------------------------------------------------------------------------------------------------*/

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


/*-----------------------------------------------------------------------------------------------
        Schema Types
-------------------------------------------------------------------------------------------------*/
export interface IPlayer extends mongoose.Document {
    discordId: string,
    rating: number,
    wins: number,
    losses: number,
    kills: number,
    deaths: number,
    resurrects: number,
    bonusTotal: number,
    friendlyFire: number,
    isBanned: boolean
}

export interface IQueue extends mongoose.Document {
    discordId: string,
    messageId: string,
    ready: boolean
}

export interface ILeaderboard extends mongoose.Document {
    messageId: string,
    device: string,
    page: number;
}

export interface IGuild extends mongoose.Document {
    guildId: string,
    rankedCategoryId: string,
    queueChannelId: string,
    matchChannelId: string,
    leaderboardChannelId: string
}