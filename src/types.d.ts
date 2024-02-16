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

export type Field = {
    name: string;
    value: string;
    inline: boolean;
};


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
    lastMatchDate: Date,
}

export interface IQueuePlayer extends mongoose.Document {
    discordId: string,
    messageId: string,
    matchMessageId: string,
    queuePosition: number,
    queueTime: Date,
    team: number,
    ready: boolean
}

export interface IQueue extends mongoose.Document {
    messageId: string,
    rankMin: number,
    rankMax: number,
    hidePlayerNames: boolean,
    multiplier: number
}

export interface IMatch extends mongoose.Document {
    messageId: string,
    queueId: string,
    map1Winner: string,
    map2Winner: string,
    map3Winner: string,
    matchWinner: string,
    map1: string,
    map2: string,
    map3: string,
    team1ReportedT1G1Rounds: number,
    team1ReportedT1G2Rounds: number,
    team1ReportedT1G3Rounds: number,
    team1ReportedT2G1Rounds: number,
    team1ReportedT2G2Rounds: number,
    team1ReportedT2G3Rounds: number,
    team2ReportedT1G1Rounds: number,
    team2ReportedT1G2Rounds: number,
    team2ReportedT1G3Rounds: number,
    team2ReportedT2G1Rounds: number,
    team2ReportedT2G2Rounds: number,
    team2ReportedT2G3Rounds: number
}
export interface IMatchPlayer extends mongoose.Document {
    discordId: string,
    matchMessageId: string,
    team: number
}

export interface ILeaderboard extends mongoose.Document {
    messageId: string,
    device: string,
    page: number
}

export interface IMap extends mongoose.Document {
    name: string,
    gameType: string,
    uniqueId: number
}

export interface IGuild extends mongoose.Document {
    guildId: string,
    hideNameElo: boolean,
    rankedCategoryId: string,
    queueChannelId: string,
    matchChannelId: string,
    leaderboardChannelId: string,
    bronzeEmojiId: string,
    silverEmojiId: string,
    goldEmojiId: string,
    platinumEmojiId: string,
    diamondEmojiId: string,
    obsidianEmojiId: string,
    bronzeRoleId: string,
    silverRoleId: string,
    goldRoleId: string,
    platinumRoleId: string,
    diamondRoleId: string,
    obsidianRoleId: string,
    bronzeMin: number,
    bronzeMax: number,
    silverMin: number,
    silverMax: number,
    goldMin: number,
    goldMax: number,
    platinumMin: number,
    platinumMax: number,
    diamondMin: number,
    diamondMax: number,
    obsidianMin: number,
    obsidianMax: number
}