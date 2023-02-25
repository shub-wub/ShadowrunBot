import { ChannelType, Client, CommandInteraction, MappedGuildChannelTypes, SlashCommandBuilder, TextChannel } from "discord.js";
import { mongoError } from "#utilities";
import { createGuild } from "#operations";
import Guild from "../schemas/guild";
import { SlashCommand } from "../types";

const command: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("srinitialize")
        .setDescription("Use once to initialize the Shadowrun Bot."),
    execute: async (interaction: CommandInteraction, client: Client) => {
        interaction.guild?.channels.create({
            name: "Ranked",
            type: ChannelType.GuildCategory
        }).then((cat: MappedGuildChannelTypes[ChannelType.GuildCategory]) => {
            const queueChannelCreate = interaction.guild?.channels.create({
                    name: "queue",
                    type: ChannelType.GuildText,
                    parent: cat.id
                });
            const matchChannelCreate = interaction.guild?.channels.create({
                    name: "matches",
                    type: ChannelType.GuildText,
                    parent: cat.id
                });
            const leaderboardChannelCreate = interaction.guild?.channels.create({
                    name: "leaderboard",
                    type: ChannelType.GuildText,
                    parent: cat.id
                });
    
            Promise.all([queueChannelCreate as Promise<TextChannel>, matchChannelCreate as Promise<TextChannel>, leaderboardChannelCreate as Promise<TextChannel>]).then((channels) => {
                const guild = new Guild({
                    guildId: interaction.commandGuildId as string,
                    rankedCategoryId: cat.id,
                    queueChannelId: channels[0].id,
                    matchChannelId: channels[1].id,
                    leaderboardChannelId: channels[2].id
                });

                createGuild(guild).then(guildRecord => {
                    interaction.reply({
                        content: `Category with id: ${guildRecord.rankedCategoryId} was created. Channels with ids ${guildRecord.queueChannelId}, ${guildRecord.matchChannelId}, ${guildRecord.leaderboardChannelId} were created.`,
                        ephemeral: true
                    });
                }).catch(error => {
                    mongoError(error);
                    interaction.reply({
                        content: `There was an error creating the guild record in the database.`,
                        ephemeral: true
                    });
                });
            });
        });
    }
}

export default command;