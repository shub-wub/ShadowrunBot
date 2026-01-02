import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
	data: new SlashCommandBuilder()
		.setName("suggestlineup")
		.setDescription("Suggest the in-game race lineup"),
	execute: async (interaction: CommandInteraction, client: Client) => {
        var chosenRaces = [0, 0, 0, 0];
        const dwarfChosen = Math.random() < 0.02
        if (dwarfChosen) {
            chosenRaces[3] = 1;
        }
        var raceOdds = [33, 33, 33];
        var range = 0;
        for (let i = 0; i < 3; i++) {
            range = range + raceOdds[i];
        }
        for (let i = 0; i < 4 - (dwarfChosen ? 1 : 0); i++) {
            var randomValue = Math.random() * range;
            var runningOddCheck = 0;
            for (let j = 0; j < raceOdds.length; j++) {
                runningOddCheck = runningOddCheck + raceOdds[j];
                if (randomValue < runningOddCheck) {
                    chosenRaces[j] += 1;
                    raceOdds[j] = Math.max(0, raceOdds[j] - 11);
                    range -= 11;
                    break;
                }
            }
        }
        var teamString = "";
        var runningPlayerCount = 0;
        if (chosenRaces[0] > 0) {
            teamString = teamString + `Humans: ${chosenRaces[0]}`;
            runningPlayerCount += chosenRaces[0];
            if (runningPlayerCount != 4) {
                teamString = teamString + ", ";
            }
        }
        if (chosenRaces[1] > 0) {
            teamString = teamString + `Elves: ${chosenRaces[1]}`;
            runningPlayerCount += chosenRaces[1];
            if (runningPlayerCount != 4) {
                teamString = teamString + ", ";
            }
        }
        if (chosenRaces[2] > 0) {
            teamString = teamString + `Trolls: ${chosenRaces[2]}`;
            runningPlayerCount += chosenRaces[2];
            if (runningPlayerCount != 4) {
                teamString = teamString + ", ";
            }
        }
        if (chosenRaces[3] > 0) {
            teamString = teamString + `Dwarves: ${chosenRaces[3]}`;
        }
        await interaction.reply({
            content: `Suggested Lineup: ${teamString}`
        });
        return;
    },
	cooldown: 1,
};

export default command;
