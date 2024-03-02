import { ActionRowBuilder, CacheType, Client, CommandInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, } from "discord.js";
import { mongoError } from "#utilities";
import { IGuild } from "../../types";
import Guild from "#schemas/guild";
import QueuePlayer from "#schemas/queuePlayer";
import { MongooseError } from "mongoose";
import { refreshQueue } from "../sharedFunctions";

export const openClearQueuesModal = (interaction: CommandInteraction<CacheType>): void => {
    const modal = new ModalBuilder()
        .setCustomId("clearQueues")
        .setTitle("Clear Queues Confirmation")
        .addComponents([
            new ActionRowBuilder<TextInputBuilder>().addComponents([
                new TextInputBuilder()
                    .setCustomId("clearQueues")
                    .setLabel("Clear Queues? (yes/no)")
                    .setValue("no")
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short),
            ]),
        ]);
    interaction.showModal(modal);
};

export const submitClearQueuesModal = async (interaction: ModalSubmitInteraction<CacheType>, client: Client): Promise<void> => {
    var clearQueuesFieldValue = interaction.fields.getTextInputValue("clearQueues");
    var clearQueue = false;

    if (clearQueuesFieldValue.toLocaleLowerCase() == "yes") {
        clearQueue = true;
    } else {
        clearQueue = false;
    }
    if (!clearQueue) {
        return;
    }

    const guildRecord = await Guild.findOne<IGuild>({ guildId: interaction.guildId });
    const uniqueQueueMessageIds = await QueuePlayer.distinct('messageId', {matchMessageId: {$exists: false}});
    if (guildRecord) {        
        try {
            await QueuePlayer.deleteMany({ matchMessageId: {$exists: false} });
        } catch (error) {
            mongoError(error as MongooseError);
            console.log(`There was an error deleting the queuePlayers from the database.`);
            return;
        }
        for (const queueMessageId of uniqueQueueMessageIds) {
            refreshQueue(interaction, queueMessageId);
        }
        await interaction.reply({
            content: `The queues have been cleared.`,
            ephemeral: true
        });
    } else {
        await interaction.reply({
            content: `There was no guild record found. Try using /srinitialize first.`,
            ephemeral: true
        });
    }
}
