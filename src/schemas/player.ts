import { Schema, model } from "mongoose";
import { IPlayer } from "../types";

const playerSchema = new Schema<IPlayer>({
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
});

const PlayerModel = model("Player", playerSchema, "players");

export default PlayerModel;