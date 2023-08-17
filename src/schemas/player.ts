import { Schema, model } from "mongoose";
import { IPlayer } from "../types";

const playerSchema = new Schema<IPlayer>({
    discordId: { type : String , unique : true, required : true },
    rating: Number,
    wins: Number,
    losses: Number,
    kills: Number,
    deaths: Number,
    resurrects: Number,
    bonusTotal: Number,
    friendlyFire: Number,
    isBanned: Boolean,
    lastMatchDate: Date
});

export default model("Player", playerSchema, "players");