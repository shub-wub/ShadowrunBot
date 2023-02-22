import mongoose from "mongoose";
import Player from "../schemas/player"

export const getPlayerByDiscordId = async (playerId: Number) => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    let playerProfile = await Player.findOne({ discordId: playerId });
    if (!playerProfile) return null;
    return playerProfile;
}