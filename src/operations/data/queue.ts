import mongoose from "mongoose";
import { IQueue } from "../../types";
import Queue from "../../schemas/queue";

export const getQueuePlayersByMessageId = async (messageId: string): Promise<IQueue[]> => {
    if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
    return await Queue.find<IQueue>({ messageId: messageId });
}

export const getQueueByPlayerIdAndMessageId = async (messageId: string, playerId: string): Promise<IQueue[]> => {
        if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
        return await Queue.find<IQueue>().and([{ messageId: messageId}, { discordId: playerId}]);
}

export const createQueue = async (queue: IQueue): Promise<IQueue> => {
        if (mongoose.connection.readyState === 0) throw new Error("Database not connected.");
        return await new Queue({
            discordId: queue.discordId,
            messageId: queue.messageId,
            ready: queue.ready
        }).save();
}