import { Schema, model } from "mongoose";
import { IQueue } from "../types";

const queueSchema = new Schema<IQueue>({
    discordId: Number,
    messageId: String,
    ready: Boolean
});

export default model("Queue", queueSchema, "queues");