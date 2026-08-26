import { CommandInteraction, CacheType, MessageFlags } from "discord.js";
import Map from "#schemas/map";

export const mapModify = async (
    interaction: CommandInteraction<CacheType>
): Promise<void> => {
    try {
        const mapId = (interaction as any).options.getString('map');
        const playable = (interaction as any).options.getBoolean('playable');
        const map_pool_choice = (interaction as any).options.getString('map_pool');

        const map = await Map.findOne({'_id' : mapId});
        if (!map) throw Error("Couldn't find map in DB");

        map.selectable = playable;

        map.mapPool = map_pool_choice ?? "A";

        map.save();

        await interaction.reply({
            content:`You selected: ${map.name} as ${!playable ? 'not playable.' : `playable for ${map_pool_choice ?? `Map Pool ${map_pool_choice ?? "A"}`}`}`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.log(error)
        return;
    }
};
