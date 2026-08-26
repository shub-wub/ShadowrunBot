import { Client, Interaction } from "discord.js";
import Map from "#schemas/map";

export function interactionsHandler(client: Client) {
    client.on('interactionCreate', async(interaction: Interaction)=>{
        if (!interaction.isAutocomplete()) return;

        if (interaction.commandName == 'maps') {
            try {
                const focusedOption = interaction.options.getFocused(true);

                if (focusedOption.name == 'map') {
                    const input = focusedOption.value;
                    const mapOptions = await Map.find({ name: { $regex: input, $options: 'i' } }).limit(25);

                    const choices = mapOptions.map(mapOption => ({
                        name: mapOption.name, // Display name for the choice
                        value: mapOption.id.toString() // Value to be sent when chosen (e.g., MongoDB _id)
                    }));

                    await interaction.respond(choices);

                }

                if (focusedOption.name == 'map_pool') {
                    const input = focusedOption.value;

                    const choices = ["A", "B"]
                    const filtered = choices.filter((choice) => choice);
                    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));

                }

                if (focusedOption.name == 'method') {
                    const input = focusedOption.value;

                    const choices = [
                        'All Attrition Maps Have Even Chances',
                        'Map Pools with Map Pool B for Game 3',
                        'Attrition Maps 1 & 3, Extraction Map 2',
                        'Extraction has a chance of being in any spot',
                    ];
                    const filtered = choices.filter((choice) => choice);
                    await interaction.respond(filtered.map((choice, i) => ({ name: choice, value: String(i + 1) })));

                }
            } catch (error) {
                console.log(error);
                return;
            }
        }
    })
}
