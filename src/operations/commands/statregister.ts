import { mongoError } from "#utilities";
import { CommandInteraction, CacheType, ChannelType, MappedGuildChannelTypes, TextChannel } from "discord.js";
import { createGuild, getGuildByGuildId, getPlayerByDiscordId } from "#operations";
import Player from "../../schemas/player";
import mongoose, { MongooseError } from "mongoose";

export const statRegister = async (interaction: CommandInteraction<CacheType>): Promise<void> => {
    var discordUser = interaction.options.getUser('discorduser');
    if(!discordUser) return;
    var discordId = discordUser.id;

    var existingPlayer = await getPlayerByDiscordId(discordId);
    if(existingPlayer) {
        await interaction.reply({
            content: `Player with discord tag: ${discordUser.username} already exists in the stat tracking database.`,
            ephemeral: true
        });
        return;
    }

    try {
        await new Player({
            discordId: discordId,
            rating: 1000,
            wins: 0,
            losses: 0,
            kills: 0,
            deaths: 0,
            resurrects: 0,
            bonusTotal: 0,
            friendlyFire: 0
        }).save();
    } catch(error) {
        await interaction.reply({
            content: `There was an error saving the record to the database.`,
            ephemeral: true
        });
        return;
    }
    await interaction.reply({
        content: `Player with discord tag: ${discordUser.username} has been added in the stat tracking database.`,
        ephemeral: true
    });
}