import mongoose from "mongoose";
import { color } from "#utilities";
const { databaseToken } = process.env;

export function mongoHandler() {
    if (!databaseToken) return console.log(color("text",`🍃 Mongo URI not found, ${color("error", "skipping.")}`))
    mongoose.connect(`${databaseToken}`)
    .then(() => console.log(color("text",`🍃 MongoDB connection has been ${color("variable", "established.")}`)))
    .catch(() => console.log(color("text",`🍃 MongoDB connection has been ${color("error", "failed.")}`)))
}