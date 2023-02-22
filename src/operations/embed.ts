import mongoose from "mongoose";
import { IEmbed } from "../types";
import Embed from "../schemas/embed";


export const getEmbedByMessageId = (messageId: string): Promise<IEmbed> => {
    return new Promise<IEmbed>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        Embed.findOne<IEmbed>({ messageId: messageId }).then(embedRecord => {
            if (!embedRecord) reject(`Could not find Embed with message id ${messageId}`);
            else resolve(embedRecord);
        });
    });
}

export const createEmbed = (embed: IEmbed): Promise<IEmbed> => {
    return new Promise<IEmbed>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        console.log(embed);
        new Embed({
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
        }).save().then(savedRecod => {
            resolve(savedRecod);
        }).catch((error) => reject(error));
    });
}