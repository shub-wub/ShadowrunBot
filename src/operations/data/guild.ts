import mongoose from "mongoose";
import { IGuild } from "../../types";
import Guild from "../../schemas/guild";

export const getGuildByGuildId = async (guildId: string): Promise<IGuild | null> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    return await Guild.findOne<IGuild>({ guildId: guildId });
}

export const createGuild = async (guild: IGuild): Promise<IGuild> => {
        if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
        return await new Guild({
            guildId: guild.guildId,
            rankedCategoryId: guild.rankedCategoryId,
            queueChannelId: guild.queueChannelId,
            matchChannelId: guild.matchChannelId,
            leaderboardChannelId: guild.leaderboardChannelId
        }).save();
}