import { IGuild, IPlayer, IQueuePlayer } from "../types";

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

export const calculateTeamElo = (winningTeam: IPlayer[], losingTeam: IPlayer[], rnaRoundsWon: number, lineageRoundsWon: number): any => {
    let winningTeamRating = 0;
    let losingTeamRating = 0;
    let roundDifference = Math.abs(rnaRoundsWon - lineageRoundsWon);
    let roundAdjustment = ((roundDifference * 100) / 6) / 200

    for (let i = 0; i < winningTeam.length; i++) {
        winningTeamRating += winningTeam[i].rating;
    }

    for (let i = 0; i < losingTeam.length; i++) {
        losingTeamRating += losingTeam[i].rating;
    }

    winningTeam.forEach(player => {
        player.wins += 1;
        let winLossRatio = player.wins / (player.wins + player.losses);
        let k = 26 * (winLossRatio + roundAdjustment + 1);
        let expectedScore = 1 / (1 + Math.pow(10, (losingTeamRating/losingTeam.length - player.rating) / 1400));
        player.rating = player.rating + k * (1 - expectedScore);
        player.rating = Math.round(player.rating);
    });

    losingTeam.forEach(player => {
        player.losses += 1;
        let winLossRatio = player.wins / (player.wins + player.losses);
        let k = 25 * (roundAdjustment + (1 - winLossRatio ) + 1);
        let expectedScore = 1 / (1 + Math.pow(10, (winningTeamRating/winningTeam.length - player.rating) / 1400));
        player.rating = player.rating + k * (0 - expectedScore);
        player.rating = Math.round(player.rating);
    });
}