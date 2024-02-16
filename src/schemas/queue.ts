import { Schema, model } from "mongoose";
import { IQueue } from "../types";

const queueSchema = new Schema<IQueue>({
    messageId: String,
    rankMin: Number,
    rankMax: Number,
    hidePlayerNames: Boolean,
    multiplier: Number
});

export default model("Queue", queueSchema, "queues");