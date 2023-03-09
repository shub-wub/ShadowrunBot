import { Schema, model } from "mongoose";
import { IMatch } from "../types";

const matchSchema = new Schema<IMatch>({
    messageId: String,
    winner: String,
    map1: String,
    map2: String,
    map3: String,
    team1G1Rounds: Number,
    team1G2Rounds: Number,
    team1G3Rounds: Number,
    team2G1Rounds: Number,
    team2G2Rounds: Number,
    team2G3Rounds: Number,
});

export default model("Match", matchSchema, "matches");