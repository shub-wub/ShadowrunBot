import { Schema, model } from "mongoose";
import { IQueuePlayer } from "../types";

const queuePlayerSchema = new Schema<IQueuePlayer>({
    discordId: String,
    messageId: String,
    matchMessageId: String,
    ready: Boolean
});

export default model("QueuePlayer", queuePlayerSchema, "queueplayers");