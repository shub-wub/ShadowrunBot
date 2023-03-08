import { Schema, model } from "mongoose";
import { IMatch } from "../types";

const matchSchema = new Schema<IMatch>({
    messageId: String,
    winner: String,
    rnaG1Rounds: Number,
    rnaG2Rounds: Number,
    rnaG3Rounds: Number,
    lineageG1Rounds: Number,
    lineageG2Rounds: Number,
    lineageG3Rounds: Number,
});

export default model("Match", matchSchema, "matches");