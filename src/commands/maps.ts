import { CommandInteraction, SlashCommandBuilder, MessageFlags, Client } from 'discord.js';
import { SlashCommand } from '../types';
import Map from '#schemas/map'
import Guild from '#schemas/guild';
import { IGuild } from '../types';
import { isNerdsOfficerOrBetter, mapModify } from '#operations';


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
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('map_pool')
                    .setDescription('What map pool the map should be in (only matters for certain map selection methods).')
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
        )
        .addSubcommand( subcommand => 
            subcommand
            .setName('selection_method')
            .setDescription("Change the selection method / algorithm used to select maps.")
            .addStringOption(option =>
                option
                    .setName('method')
                    .setDescription('The method to use.')
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
                    const replyMessage = `${map?.name} - ${map?.selectable ? 'Playable' : `Not Playable`} - Map Pool ${map?.mapPool}`;
                    await interaction.reply({
                        content: replyMessage,
                        flags: MessageFlags.Ephemeral
                    })
                } catch(error) {
                    console.log(error);
                    return;
                }
            }
            else if ((interaction as any).options.getSubcommand() === 'selection_method') {
                try {
                    const guild = await Guild.findOne<IGuild>({guildId: interaction.guildId});
                    if (!guild) throw Error('Could not find Guild record');
                    const selected_method_value = (interaction as any).options.getString('method') ?? 1;
                    guild.mapSelectionMethod = Number(selected_method_value);
                    guild.save();

                    const currentTime = new Date(Date.now()).toLocaleString();
                    console.log(currentTime + " " + interaction.user.username + " set map selection method " + selected_method_value);
                    await interaction.reply({
                        content:`You chose Map Selection Algorithm ${selected_method_value}`,
                        flags: MessageFlags.Ephemeral
                    });

                } catch(error) {
                    console.log(error);
                    return;
                }
            }
        },
        cooldown: 1,
};

export default command;
