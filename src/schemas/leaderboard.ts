import { Schema, model } from "mongoose";
import { ILeaderboard } from "../types";

const leaderboardSchema = new Schema<ILeaderboard>({
    messageId: String,
    device: String,
    page: Number
});

export default model("Leaderboard", leaderboardSchema, "leaderboards");