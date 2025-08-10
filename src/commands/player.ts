import { CommandInteraction, SlashCommandBuilder, MessageFlags, Client } from 'discord.js';
import { SlashCommand } from '../types';
import { isNerdsOfficerOrBetter, playerEloSet, playerSub } from '#operations';


const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName('player')
		.setDescription('Player specific commands.')
        .addSubcommand( subcommand =>
            subcommand
            .setName('elo')
            .setDescription('Set a player\'s ELO to a specific value.')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The player you want to set an elo for.')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('value')
                    .setDescription('The ELO amount you want to set the player to.')
                    .setRequired(true)
            )
        )
        .addSubcommand( subcommand =>
            subcommand
            .setName('sub')
            .setDescription('Sub a player out from a game.')
            .addUserOption(option =>
                option
                    .setName('player1')
                    .setDescription('The player you want to be subbed out.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option
                    .setName('player2')
                    .setDescription('The discord user you want to add into the game.')
                    .setRequired(true)
            )
        ),
        execute: async (interaction: CommandInteraction, client: Client) => {
            const canPerformCommand = isNerdsOfficerOrBetter(interaction);
            if (!canPerformCommand) {
                await interaction.reply({
                    content: `Only a Nerds Officer or staff member can use Player commands.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
            else if ((interaction as any).options.getSubcommand() === 'elo') {
                playerEloSet(interaction);
            }
            else if ((interaction as any).options.getSubcommand() === 'sub') {
                playerSub(interaction, client);
            }
        },
        cooldown: 1,
};

export default command;
