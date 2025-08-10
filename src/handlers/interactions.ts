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
            } catch (error) {
                console.log(error);
                return;
            }
        }
    })
}
