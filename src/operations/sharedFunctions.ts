import { ButtonInteraction, GuildMember, PermissionsBitField } from "discord.js";
import { IGuild, IPlayer, IQueuePlayer } from "../types";
import QueuePlayer from "#schemas/queuePlayer";

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

export const getRankRole = (player: IPlayer, guild: IGuild): String => {
    var role = "";
    if(player.rating <= guild.bronzeMax) {
        role = guild.bronzeRoleId;
    } else if (player.rating <= guild.silverMax) {
        role = guild.silverRoleId;
    } else if (player.rating <= guild.goldMax) {
        role = guild.goldRoleId;
    } else if (player.rating <= guild.platinumMax) {
        role = guild.platinumRoleId;
    } else if (player.rating <= guild.diamondMax) {
        role = guild.diamondRoleId;
    }
    return role;
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

export const calculateTeamElo = (winningTeam: IPlayer[], losingTeam: IPlayer[], winningTeamRoundsWon: number, losingTeamRoundsWon: number): any => {
    const currentDate = new Date();
    let winningTeamRating = 0;
    let losingTeamRating = 0;
    let teamEloDifference200 = .25;
    let teamEloDifference300 = .50;
    let teamEloDifference400 = .75;
    let roundDifference = Math.abs(winningTeamRoundsWon - losingTeamRoundsWon);
    let roundAdjustment = (roundDifference / 6) / 2;
    var winningTeamDifferenceAdjustment = 0;
    var losingTeamDifferenceAdjustment = 0;

    for (let i = 0; i < winningTeam.length; i++) {
        winningTeamRating += winningTeam[i].rating;
    }

    for (let i = 0; i < losingTeam.length; i++) {
        losingTeamRating += losingTeam[i].rating;
    }

    if (Math.abs(winningTeamRating - losingTeamRating) > 400) {
        winningTeamDifferenceAdjustment = teamEloDifference400;
        losingTeamDifferenceAdjustment = teamEloDifference400;
    } else if (Math.abs(winningTeamRating - losingTeamRating) > 300) {
        winningTeamDifferenceAdjustment = teamEloDifference300;
        losingTeamDifferenceAdjustment = teamEloDifference300;
    } else if (Math.abs(winningTeamRating - losingTeamRating) > 200) {
        winningTeamDifferenceAdjustment = teamEloDifference200;
        losingTeamDifferenceAdjustment = teamEloDifference200;
    } 

    // if the favorite won both teams take less impact
    if (winningTeamRating > losingTeamRating) {
        winningTeamDifferenceAdjustment *= -1;
        losingTeamDifferenceAdjustment *= -1;
    }
    
    winningTeam.forEach(player => {
        player.wins += 1;
        player.lastMatchDate = currentDate;
        let winLossRatio = player.wins / (player.wins + player.losses);
        let k = 26 * (winLossRatio + roundAdjustment + winningTeamDifferenceAdjustment + 1);
        let expectedScore = 1 / (1 + Math.pow(10, (losingTeamRating/losingTeam.length - player.rating) / 4000));
        player.rating = player.rating + k * (1 - expectedScore);
        player.rating = Math.round(player.rating);
    });

    losingTeam.forEach(player => {
        player.losses += 1;
        player.lastMatchDate = currentDate;
        let winLossRatio = player.wins / (player.wins + player.losses);
        let k = 25 * ((1 - winLossRatio) + roundAdjustment + losingTeamDifferenceAdjustment + 1);
        let expectedScore = 1 / (1 + Math.pow(10, (winningTeamRating/winningTeam.length - player.rating) / 4000));
        player.rating = player.rating + k * (0 - expectedScore);
        player.rating = Math.round(player.rating);
    });
}

export const getQueuePlayers = async (interaction: ButtonInteraction): Promise<IQueuePlayer[]> => {
    return await QueuePlayer.find<IQueuePlayer>().and([
        { messageId: interaction.message.id }, 
        { matchMessageId: { $exists: false } }
    ]);
}

export const getQueuePlayersAsText = async (interaction: ButtonInteraction, queuePlayers: IQueuePlayer[]): Promise<string> => {
    var text = "";
    var guildMemberQueries: Promise<GuildMember>[] = [];
    for (const wp of queuePlayers) {
        if (interaction.guild) {
            guildMemberQueries.push(interaction.guild?.members.fetch(wp.discordId));
        }
    }

    const queryResults = await Promise.all(guildMemberQueries);
    for (const qr of queryResults) {
        text += qr.nickname + " " + qr.user.id + "\n";
    }
    
    return text;
}

export const isGmOrBetter = async (interaction: ButtonInteraction): Promise<boolean> => {
    var guildUser = await interaction.guild?.members.fetch(interaction.user.id);

    return guildUser?.roles.cache.some(r => r.name.toLocaleLowerCase() === 'gm' || r.name.toLocaleLowerCase() === 'moderator' || r.name.toLocaleLowerCase() === 'admin') as boolean;
    //const isAdmin = guildUser?.permissions.has(PermissionsBitField.Flags.Administrator);
}