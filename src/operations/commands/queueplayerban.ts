import { mongoError } from "#utilities";
import { CommandInteraction, CacheType } from "discord.js";
import QueuePlayerBan from "#schemas/queuePlayerBan";
import { MongooseError } from "mongoose";
import { IPlayer } from "../../types";
import { isGmOrBetter } from "#operations";

export const toggleQueuePlayerBan = async (
    interaction: CommandInteraction<CacheType>
): Promise<void> => {
    const canClear = isGmOrBetter(interaction);
    if (!canClear) {
        await interaction.reply({
            content: `Only a GM or staff member can clear all the queues.`,
            ephemeral: true
        });
        return;
    }
    
    var queueId: string = (interaction.options as any).getString("queueid");
    var discordUser = interaction.options.getUser("playerid");
    if (!queueId) return;
    if (!discordUser) return;
    var discordId = discordUser.id;

    const currentTime = new Date(Date.now()).toLocaleString();
    console.log(currentTime + " " + interaction.user.username + " submitted command togglequeueplayerban on queue " + queueId + " for player " + discordUser.username);

    var existingBan = await QueuePlayerBan.findOne<IPlayer>({
        playerDiscordId: discordId,
        queueMessageId: queueId
    });

    if (existingBan) {
    
        try {
            await QueuePlayerBan.deleteOne({ _id: existingBan._id });
        } catch (error) {
            mongoError(error as MongooseError);
            console.log(`There was an error deleting the queue player ban from the database.`)
            return;
        }
        await interaction.reply({
            content: `Player with discord tag: ${discordUser.username} unbanned from queue: ${queueId}.`,
            ephemeral: true,
        });
        return;
    }

    else {
        try {
            await new QueuePlayerBan({
                playerDiscordId: discordId,
                queueMessageId: queueId
            }).save();
        } catch (error) {
            mongoError(error as MongooseError);
            console.log(`There was an error saving the record to the database.`);
            return;
        }
        await interaction.reply({
            content: `Player with discord tag: ${discordUser.username} banned from queue: ${queueId}.`,
            ephemeral: true,
        });
    }
};
