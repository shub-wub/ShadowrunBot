import { CommandInteraction, CacheType, MessageFlags } from "discord.js";
import Player from "#schemas/player";
import { IPlayer } from "../../types";

export const playerEloSet = async (
    interaction: CommandInteraction<CacheType>
): Promise<void> => {
    try {
        var player = (interaction as any).options.getUser('user');
        const playerUsername = player.username;
        if (!player) return;
        var discordId = player.id;
        var eloTarget = (interaction as any).options.getInteger('value');
        const currentTime = new Date(Date.now()).toLocaleString();
        console.log(currentTime + ' ' + interaction.user.username + ' submitted command set ELO for ' + playerUsername + ' to ' + eloTarget);
        const playerQuery = Player.findOne<IPlayer>({discordId: discordId});
        await Promise.all([playerQuery])
        .then(async (queryResults: [IPlayer | null]) => {
            const player = queryResults[0];
            if (!player) throw Error('Could not find player in DB');
            player.rating = eloTarget;
            player.save()
            await interaction.reply({
                content: `Player ${playerUsername} has had their ELO set to ${eloTarget}.`,
                flags: MessageFlags.Ephemeral
            });
        })
    } catch (error) {
        console.log(error)
        return;
    }
};
