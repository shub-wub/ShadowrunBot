import { CommandInteraction, SlashCommandBuilder, MessageFlags, Client } from 'discord.js';
import { SlashCommand } from '../types';
import Map from '#schemas/map'
import { isNerdsOfficerOrBetter, mapModify } from '#operations';
import map from '#schemas/map';


const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName('maps')
		.setDescription('Maps specific commands.')
        .addSubcommand( subcommand =>
            subcommand
            .setName('modify')
            .setDescription('Modify a specific map.')
            .addStringOption(option =>
                option
                    .setName('map')
                    .setDescription('The map you want to modify.')
                    .setAutocomplete(true)
                    .setRequired(true)
            )
            .addBooleanOption(option =>
                option
                    .setName('playable')
                    .setDescription('Set the map into rotation.')
                    .setRequired(false)
            )
            .addBooleanOption(option =>
                option
                    .setName('map_3_only')
                    .setDescription('Whether the map should be for Map 3 only or playable for Maps 1 and/or 2.')
                    .setRequired(false)
            )
        )
        .addSubcommand( subcommand => 
            subcommand
            .setName('info')
            .setDescription("Info of a specified map's playability.")
            .addStringOption(option =>
                option
                    .setName('map')
                    .setDescription('The map you want info on.')
                    .setAutocomplete(true)
                    .setRequired(true)
            )
        ),
        execute: async (interaction: CommandInteraction, client: Client) => {
            const canPerformCommand = isNerdsOfficerOrBetter(interaction);
            if (!canPerformCommand) {
                await interaction.reply({
                    content: `Only a Nerds Officer or staff member can use Maps commands.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            else if ((interaction as any).options.getSubcommand() === 'modify') {
                mapModify(interaction);
            }
            else if ((interaction as any).options.getSubcommand() === 'info') {
                try {
                    const mapId = (interaction as any).options.getString('map');
                    const map = await Map.findOne({_id: mapId});
                    if (!map) throw Error('Could not find map in DB');
                    const replyMessage = `${map?.name} - ${map?.gameType == 'Out of Rotation' ? 'Not Playable' : `Playable  - ${map?.mapPool == 'B' ? 'Map 3 Only' : 'Map 1 and/or Map 2'}`}`;
                    await interaction.reply({
                        content: replyMessage,
                        flags: MessageFlags.Ephemeral
                    })
                } catch(error) {
                    console.log(error);
                    return;
                }
            }
        },
        cooldown: 1,
};

export default command;
