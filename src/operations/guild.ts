import mongoose from "mongoose";
import { IGuild } from "../types";
import Guild from "../schemas/guild";

export const getGuildByGuildId = (guildId: string): Promise<IGuild> => {
    return new Promise<IGuild>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        Guild.findOne<IGuild>({ guildId: guildId }).then(guildRecord => {
            if (!guildRecord) reject(`Could not find guild with id ${guildId}`);
            else resolve(guildRecord);
        });
    });
}

export const createGuild = (guild: IGuild): Promise<IGuild> => {
    return new Promise<IGuild>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        new Guild({
            guildId: guild.guildId,
            rankedCategoryId: guild.rankedCategoryId,
            queueChannelId: guild.queueChannelId,
            matchChannelId: guild.matchChannelId,
            leaderboardChannelId: guild.leaderboardChannelId
        }).save().then(savedRecod => {
            resolve(savedRecod);
        }).catch((error) => reject(error));
    });
}