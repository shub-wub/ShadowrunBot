import mongoose from "mongoose";
import { IQueue } from "../../types";
import Queue from "../../schemas/queue";

export const getQueuePlayersByMessageId = (messageId: string): Promise<IQueue[]> => {
    return new Promise<IQueue[]>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        Queue.find<IQueue>({ messageId: messageId }).then(queueRecord => {
            resolve(queueRecord);
        });
    });
}

export const getQueueByPlayerIdAndMessageId = (messageId: string, playerId: string): Promise<IQueue[]> => {
    return new Promise<IQueue[]>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        Queue.find<IQueue>().and([{ messageId: messageId}, { discordId: playerId}]).then(queueRecords => {
            resolve(queueRecords);
        });
    });
}

export const createQueue = (queue: IQueue): Promise<IQueue> => {
    return new Promise<IQueue>((resolve, reject) => {
        if (mongoose.connection.readyState === 0) reject("Database not connected.");
        new Queue({
            discordId: queue.discordId,
            messageId: queue.messageId,
            ready: queue.ready
        }).save().then(savedRecord => {
            resolve(savedRecord);
        }).catch((error) => reject(error));
    });
}