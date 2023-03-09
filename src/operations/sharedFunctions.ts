import { IGuild, IPlayer } from "src/types";

export const getRankEmoji = (player: IPlayer, guild: IGuild): String => {
    var emoji = "";
    if(player.rating <= guild.bronzeMax) {
        emoji = `<:bronze:${guild.bronzeEmojiId}>`;
    } else if (player.rating <= guild.silverMax) {
        emoji = `<:silver:${guild.silverEmojiId}>`;
    } else if (player.rating <= guild.goldMax) {
        emoji = `<:gold:${guild.goldEmojiId}>`;
    } else if (player.rating <= guild.platinumMax) {
        emoji = `<:platinum:${guild.platinumEmojiId}>`;
    } else if (player.rating <= guild.diamondMax) {
        emoji = `<:diamond:${guild.diamondEmojiId}>`;
    }
    return emoji;
}

export const generateTeams = (playersInput: IPlayer[]): [IPlayer[], IPlayer[]] => { 
    const combinations: Array<Array<IPlayer>> = [];
    for (let i = 0; i < playersInput.length; i++)
      for (let j = i + 1; j < playersInput.length; j++)
        for (let k = j + 1; k < playersInput.length; k++)
          for (let l = k + 1; l < playersInput.length; l++)
            combinations.push([playersInput[i], playersInput[j], playersInput[k], playersInput[l]]);

    let bestTeamCombination: [IPlayer[], IPlayer[]] = [[],[]];
    let bestTeamRankingDifference = Infinity;

    for (const combination of combinations) {
        const team1 = combination;
        const team2 = playersInput.filter(player => !team1.includes(player));
        const difference = teamRankingDifference(team1, team2);
        if (difference < bestTeamRankingDifference) {
            bestTeamCombination = [team1, team2];
            bestTeamRankingDifference = difference;
        }
    }

    return [bestTeamCombination[0], bestTeamCombination[1]];
}

export const teamRankingDifference = (team1: IPlayer[], team2: IPlayer[]): number => {
    const team1Ranking = team1.reduce((sum, player) => sum + player.rating, 0);
    const team2Ranking = team2.reduce((sum, player) => sum + player.rating, 0);
    return Math.abs(team1Ranking - team2Ranking);
}
  