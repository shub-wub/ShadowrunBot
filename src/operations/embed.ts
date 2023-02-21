import mongoose from "mongoose";
import { IEmbed } from "src/types";
import Embed from "../schemas/embed";

export const getEmbedByMessageId = async (messageId: number) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    let embedRecord = await Embed.findOne({ messageId: messageId });
    if (!embedRecord) return null;
    return embedRecord;
}

export const createEmbed = async (embed: IEmbed) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    let embedRecord = getEmbedByMessageId(embed.messageId);
    if (!embedRecord) {
        
    } else {
        throw new Error(`Embed with id ${embed.messageId} already exists.`)
    }
}