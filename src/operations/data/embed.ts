import mongoose from "mongoose";
import { IEmbed } from "../../types";
import Embed from "../../schemas/embed";


export const getEmbedByMessageId = async (messageId: string): Promise<IEmbed | null> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    return await Embed.findOne<IEmbed>({ messageId: messageId });
}

export const createEmbed = async (embed: IEmbed): Promise<IEmbed> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    return await new Embed({
        messageId: embed.messageId,
        title: embed.title,
        description: embed.description,
        url: embed.url,
        timestamp: embed.timestamp,
        color: embed.color,
        footer: embed.footer,
        image: embed.image,
        thumbnail: embed.thumbnail,
        provider: embed.provider,
        author: embed.author,
        fields: embed.fields,
        video: embed.video,
    }).save();
}