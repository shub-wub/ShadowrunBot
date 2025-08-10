import { CommandInteraction, CacheType, MessageFlags } from "discord.js";
import Map from "#schemas/map";

export const mapModify = async (
    interaction: CommandInteraction<CacheType>
): Promise<void> => {
    try {
        const mapId = (interaction as any).options.getString('map');
        const playable = (interaction as any).options.getBoolean('playable');
        const map_3_only = (interaction as any).options.getBoolean('map_3_only');

        const map = await Map.findOne({'_id' : mapId});
        if (!map) throw Error("Couldn't find map in DB");

        const mapGameType = map?.name.includes('Attrition') ? 'Attrition' : map?.name.includes('Extraction') ? 'Extraction' : 'Raid';

        if (playable && map?.gameType == 'Out of Rotation') {
            map.gameType = mapGameType;
        }
        else if (!playable) {
            map.gameType = 'Out of Rotation';
        }

        if (map_3_only) {
            map.mapPool = 'B';
        }
        else {
            map.mapPool = 'A';
        }

        map.save();

        await interaction.reply({
            content:`You selected: ${map.name} as ${!playable ? 'not playable.' : `playable for ${map_3_only ? 'Map 3 only' : 'Map 1 and/or 2'}`}`,
            flags: MessageFlags.Ephemeral});

    } catch (error) {
        console.log(error)
        return;
    }
};
