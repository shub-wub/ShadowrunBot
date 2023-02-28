import {getThemeColor, mongoError} from "#utilities";
import {
    ActionRowBuilder,
    ButtonStyle,
    CacheType,
    ChannelType,
    CommandInteraction,
    EmbedBuilder,
    MappedGuildChannelTypes,
    Message,
    MessageActionRowComponentBuilder,
    TextChannel
} from "discord.js";
import {createGuild} from "#operations";
import Guild from "../../schemas/guild";
import Player from '../../schemas/player';
import {IPlayer} from "../../types";
import {ButtonBuilder} from "@discordjs/builders";

export const srinitialize = (interaction: CommandInteraction<CacheType>): void => {
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

export const leaderboard = (interaction: CommandInteraction<CacheType>): Promise<void> => {
    // Retrieve the players from the database and sort by rating
    return Player.find().sort('-rating')
        .then((players: IPlayer[]) => {
            const playersPerPage = 10;

            // Define a function to create a message embed with a given page of players
            const createEmbed = (page: number): any => {
                const start = (page - 1) * playersPerPage;
                const end = start + playersPerPage;
                const pagePlayers = players.slice(start, end);
                const embed: any = new EmbedBuilder()
                    .setTitle('__**ELO Leaderboard**__')
                    .setColor(getThemeColor("embed"))
                    .setDescription(`Page ${page} of ${Math.ceil(players.length / playersPerPage)}`)
                    .addFields(pagePlayers.map((player: IPlayer, index: number) => {
                        const playerPlace = index+1+(10*(page-1));
                        return {name: " ", value: `**${playerPlace}.** ${player.gamertag} - ${player.rating}`} as { name: string, value: string };
                    }));
                return embed;
            };

            // Set up a button row with pagination buttons
            const createButtonRow = (page: number): ActionRowBuilder<ButtonBuilder> => {
                const buttonRow: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>();
                const previousButton = new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1);
                const nextButton = new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === Math.ceil(players.length / playersPerPage));
                buttonRow.addComponents(previousButton, nextButton);
                return buttonRow;
            };

            // Set up a button collector to listen for button clicks and update the message
            const setupButtonCollector = (message: Message) => {
                let page = 1;
                const collector = message.createMessageComponentCollector();
                collector.on('collect', (interaction) => {
                    switch (interaction.customId) {
                        case 'previous':
                            page -= 1;
                            break;
                        case 'next':
                            page += 1;
                            break;
                    }
                    const newEmbed = createEmbed(page);
                    const newButtonRow = createButtonRow(page);
                    interaction.update({ embeds: [newEmbed], components: [newButtonRow] });
                });
            };

            // Send the initial message with the first page of players and pagination buttons
            const initialEmbed = createEmbed(1);
            const buttonRow = createButtonRow(1);
            interaction.reply({ embeds: [initialEmbed], components: [buttonRow], fetchReply: true })
                .then((initialMessage: Message) => {
                    setupButtonCollector(initialMessage);
                });
        });
}