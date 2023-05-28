import { Schema, model } from "mongoose";
import { IMatch } from "../types";

const matchSchema = new Schema<IMatch>({
    messageId: String,
    map1Winner: String,
    map2Winner: String,
    map3Winner: String,
    matchWinner: String,
    map1: String,
    map2: String,
    map3: String,
    team1ReportedT1G1Rounds: Number,
    team1ReportedT1G2Rounds: Number,
    team1ReportedT1G3Rounds: Number,
    team1ReportedT2G1Rounds: Number,
    team1ReportedT2G2Rounds: Number,
    team1ReportedT2G3Rounds: Number,
    team2ReportedT1G1Rounds: Number,
    team2ReportedT1G2Rounds: Number,
    team2ReportedT1G3Rounds: Number,
    team2ReportedT2G1Rounds: Number,
    team2ReportedT2G2Rounds: Number,
    team2ReportedT2G3Rounds: Number
});

export default model("Match", matchSchema, "matches");