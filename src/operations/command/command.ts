import {getThemeColor, mongoError} from "#utilities";
import {
    ButtonStyle,
    CacheType,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    MappedGuildChannelTypes,
    MessageActionRowComponentBuilder,
    TextChannel
} from "discord.js";
import {createGuild} from "#operations";
import Guild from "../../schemas/guild";
import Player from '../../schemas/player';
import {IPlayer} from "../../types";

export const srInitialize = (interaction: CommandInteraction<CacheType>): void => {
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

export const leaderboard = async (interaction: CommandInteraction<CacheType>): Promise<void> => {
    // Retrieve the top 10 players from the database and sort by rating
    const players: IPlayer[] = await Player.find().sort('-rating').limit(10);

    // Format the player data into a message embed
    const embed: any = new EmbedBuilder()
        .setTitle('Leaderboard')
        .setColor(getThemeColor("embed"))
        .addFields(
            players.map((player: IPlayer, index: number) => {
                return {name: " ", value: `${index+1}. ${player.discordUsername} - ${player.rating}`} as { name: string, value: string };
            })
        );

    // Send the message embed back to the user
    await interaction.reply({embeds: [embed]});
}