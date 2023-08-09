import { Schema, model } from "mongoose";
import { IQueue } from "../types";

const queueSchema = new Schema<IQueue>({
    messageId: String,
    rankMin: Number,
    rankMax: Number,
    hidePlayerNames: Boolean
});

export default model("Queue", queueSchema, "queues");