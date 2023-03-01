import mongoose from "mongoose";
import { IPlayer } from "src/types";
import Player from "../../schemas/player"

export const getPlayerByDiscordId = async (playerId: string): Promise<IPlayer | null> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    return await Player.findOne<IPlayer>({ discordId: playerId });
}