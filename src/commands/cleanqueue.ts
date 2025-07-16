import { Client, CommandInteraction, EmbedBuilder, Message, SlashCommandBuilder, TextChannel } from "discord.js";
import { SlashCommand } from "../types";
import { isGmOrBetter } from "#operations";
import { rebuildQueue } from "#operations";
import Guild from "#schemas/guild";
import { IGuild, IQueue } from "../types";
import Queue from "#schemas/queue";
import QueuePlayer from "#schemas/queuePlayer";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("cleanqueue")
		.setDescription("Remove all players from a single queue")
        .addStringOption(option =>
            option
                .setName('queueid')
                .setDescription('The message ID of the queue you want to clear.')
                .setRequired(true)
        ),
	execute: async (interaction: CommandInteraction, client: Client) => {
        const canClear = isGmOrBetter(interaction);
        if (!canClear) {
            await interaction.reply({
                content: `Only a GM or staff member can clear all the queues.`,
                ephemeral: true
            });
            return;
        }
        else {
            try {
                var queueID: string = (interaction as any).options.getString('queueid');
		console.log('Slash command queueID:', queueID);
                const currentTime = new Date(Date.now()).toLocaleString();
                console.log(currentTime + " " + interaction.user.username + " submitted command cleanqueue on queue " + queueID);
                const guild = await Guild.findOne<IGuild>({
                    guildId: interaction.guildId,
                });
                const queueChannelId = guild?.queueChannelId;
                if (!queueChannelId) throw Error("Could not find queue channel in DB");
                const channel = await client.channels.fetch(queueChannelId);
                const queueMessageQuery = (channel as TextChannel).messages.fetch(queueID);
                const queueQuery = Queue.findOne<IQueue>({messageId: queueID});
                await Promise.all([queueMessageQuery, queueQuery])
                .then(async (queryResults: [Message, IQueue | null]) => {
                    const queueMessage = queryResults[0];
                    const queue = queryResults[1];
                    const queueEmbed = EmbedBuilder.from(queueMessage.embeds[0]);
                    if (!queue) throw Error("Could not find queue in DB");
                    await QueuePlayer.deleteMany(
                        { messageId: queueID, matchMessageId: { $exists: false } }
                    )
                    rebuildQueue(interaction, queueEmbed, queueMessage, [], guild, queue, false);
                    await interaction.reply({
                        content: `The queue has been cleared. ${queueMessage.url}`,
                        ephemeral: true
                    });
                })
            } catch (error) {
                console.log(error)
                return;
            }
        }
	},
	cooldown: 1,
};

export default command;
