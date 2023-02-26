import { Schema, model } from "mongoose";
import { IPlayer } from "../types";

const playerSchema = new Schema<IPlayer>({
    discordId: Number,
    gamertag: String,
    rating: Number,
    wins: Number,
    losses: Number,
    kills: Number,
    deaths: Number,
    resurrects: Number,
    bonusTotal: Number,
    friendlyFire: Number,
    isBanned: Boolean
});

export default model("Player", playerSchema, "players");