import { Schema, model } from "mongoose";
import { IGuild } from "../types";

const guildSchema = new Schema<IGuild>({
    guildId: { type : String , unique : true, required : true },
    rankedCategoryId: { type : String , unique : true, required : true },
    queueChannelId: { type : String , unique : true, required : true },
    matchChannelId: { type : String , unique : true, required : true },
    leaderboardChannelId: { type : String , unique : true, required : true },
    bronzeEmojiId: { type : String , unique : true, required : true },
    silverEmojiId: { type : String , unique : true, required : true },
    goldEmojiId: { type : String , unique : true, required : true },
    platinumEmojiId: { type : String , unique : true, required : true },
    diamondEmojiId: { type : String , unique : true, required : true },
    bronzeRoleId: { type : String , unique : true, required : true },
    silverRoleId: { type : String , unique : true, required : true },
    goldRoleId: { type : String , unique : true, required : true },
    platinumRoleId: { type : String , unique : true, required : true },
    diamondRoleId: { type : String , unique : true, required : true },
    bronzeMin: Number,
    bronzeMax: Number,
    silverMin: Number,
    silverMax: Number,
    goldMin: Number,
    goldMax: Number,
    platinumMin: Number,
    platinumMax: Number,
    diamondMin: Number,
    diamondMax: Number,
})

export default model("guild", guildSchema, "guilds");