import { Schema, model } from "mongoose";
import { IGuild } from "../types";

const guildSchema = new Schema<IGuild>({
    guildId: { type : String , unique : true, required : true },
    rankedCategoryId: { type : String , unique : true, required : true },
    queueChannelId: { type : String , unique : true, required : true },
    matchChannelId: { type : String , unique : true, required : true },
    leaderboardChannelId: { type : String , unique : true, required : true }
})

export default model("guild", guildSchema, "guilds");