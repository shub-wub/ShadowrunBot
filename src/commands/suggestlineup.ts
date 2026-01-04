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
        const range = raceOdds[0] + raceOdds[1] + raceOdds[2];
        var playerCount = dwarfChosen ? 1 : 0;
        while (playerCount < 4) {
            const randomValue = Math.random() * range;
            var runningOddCheck = 0;
            for (let i = 0; i < raceOdds.length; i++) {
                runningOddCheck = runningOddCheck + raceOdds[i];
                if (randomValue < runningOddCheck) {
                    if (chosenRaces[i] != 3) {
                        chosenRaces[i] += 1;
                        playerCount += 1;
                    }
                    break;
                }
            }
        }

        if (chosenRaces[0] == 2 && chosenRaces[1] == 1 && chosenRaces[2] == 1) {
            chosenRaces[0] = 1;
            if (Math.random() > 0.5) {
                chosenRaces[1] = 2;
            } else {
                chosenRaces[2] = 2;
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
