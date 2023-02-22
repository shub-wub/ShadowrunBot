import { Schema, model } from "mongoose";
import { IEmbed } from "../types";

const emberSchema = new Schema<IEmbed>({
    messageId: { type : String , unique : true, required : true },
    title: String,
    description: String,
    url: String,
    timestamp: String,
    color: String,
    footer: String,
    image: String,
    thumbnail: String,
    provider: String,
    author: String,
    fields: String,
    video: String,
});

export default model("Embed", emberSchema, "embeds");