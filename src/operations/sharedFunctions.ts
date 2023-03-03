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