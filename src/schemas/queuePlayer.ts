import { Schema, model } from "mongoose";
import { IQueuePlayer } from "../types";

const queuePlayerSchema = new Schema<IQueuePlayer>({
    discordId: String,
    messageId: String,
    matchMessageId: String,
    queuePosition: Number,
    queueTime: Date,
    team: Number,
    ready: Boolean
});

export default model("QueuePlayer", queuePlayerSchema, "queueplayers");