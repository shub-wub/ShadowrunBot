import { Schema, model } from "mongoose";
import { IMap } from "../types";

const queueSchema = new Schema<IMap>({
    name: String
});

export default model("Map", queueSchema, "maps");