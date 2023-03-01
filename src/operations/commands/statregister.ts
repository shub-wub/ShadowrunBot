import { mongoError } from "#utilities";
import { CommandInteraction, CacheType } from "discord.js";
import Player from "../../schemas/player";
import { MongooseError } from "mongoose";
import { IPlayer } from "../../types";

export const statRegister = async (interaction: CommandInteraction<CacheType>): Promise<void> => {
    var discordUser = interaction.options.getUser('discorduser');
    if(!discordUser) return;
    var discordId = discordUser.id;

    var existingPlayer = await Player.findOne<IPlayer>({ discordId: discordId });
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
        mongoError(error as MongooseError);
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