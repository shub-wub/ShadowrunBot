import mongoose from "mongoose";
import { IPlayer } from "src/types";
import Player from "../../schemas/player"

export const getPlayerByDiscordId = (playerId: string): Promise<IPlayer> => {
    return new Promise<IPlayer>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        Player.findOne<IPlayer>({ discordId: playerId }).then(playerRecord => {
            if (!playerRecord) reject(`Could not find Embed with message id ${playerId}`);
            else resolve(playerRecord);
        });
    });
}