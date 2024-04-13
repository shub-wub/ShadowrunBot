import { Schema, model } from "mongoose";
import { IMap } from "../types";

const queueSchema = new Schema<IMap>({
    name: String,
    gameType: String,
    uniqueId: Number,
    mapPool: String
});

export default model("Map", queueSchema, "maps");