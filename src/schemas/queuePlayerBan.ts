import { Schema, model } from "mongoose";
import { IQueuePlayerBan } from "../types";

const queuePlayerBanSchema = new Schema<IQueuePlayerBan>({
    queueMessageId: String,
    playerDiscordId: String
});

export default model("QueuePlayerBan", queuePlayerBanSchema, "queueplayerbans");