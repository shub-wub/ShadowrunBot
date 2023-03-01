import { mongoError } from "#utilities";
import { CommandInteraction, CacheType, ChannelType, MappedGuildChannelTypes, TextChannel } from "discord.js";
import { createGuild, getGuildByGuildId } from "#operations";
import Guild from "../../schemas/guild";
import { MongooseError } from "mongoose";

export const srinitialize = async (interaction: CommandInteraction<CacheType>): Promise<void> => {
    var existingGuildRecord = getGuildByGuildId(interaction.guild?.id as string)
    var cat = await interaction.guild?.channels.create({
        name: "Ranked",
        type: ChannelType.GuildCategory
    }) as MappedGuildChannelTypes[ChannelType.GuildCategory];
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

    Promise.all([queueChannelCreate as Promise<TextChannel>, matchChannelCreate as Promise<TextChannel>, leaderboardChannelCreate as Promise<TextChannel>]).then(async (channels) => {
        const guild = new Guild({
            guildId: interaction.commandGuildId as string,
            rankedCategoryId: cat.id,
            queueChannelId: channels[0].id,
            matchChannelId: channels[1].id,
            leaderboardChannelId: channels[2].id
        });

        try {
        var guildRecord = await createGuild(guild);
            await interaction.reply({
                content: `Category with id: ${guildRecord.rankedCategoryId} was created. Channels with ids ${guildRecord.queueChannelId}, ${guildRecord.matchChannelId}, ${guildRecord.leaderboardChannelId} were created.`,
                ephemeral: true
            });
        } catch(error) {
            mongoError(error as MongooseError);
            await interaction.reply({
                content: `There was an error creating the guild record in the database.`,
                ephemeral: true
            });
        }
    });
}