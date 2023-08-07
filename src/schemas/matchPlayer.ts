import { Schema, model } from "mongoose";
import { IMatchPlayer } from "../types";

const matchPlayerSchema = new Schema<IMatchPlayer>({
    discordId: String,
    matchMessageId: String,
    team: Number
});

export default model("MatchPlayer", matchPlayerSchema, "matchplayers");