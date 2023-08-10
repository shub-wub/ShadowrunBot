import { Client, GuildBasedChannel, TextChannel } from "discord.js";
import { BotEvent, IGuild } from "../types";
import Guild from "#schemas/guild";
const {guildId } = process.env;

const event: BotEvent = {
    name: 'ready',
    once: true,
    async execute(client: Client) {
        client.user?.setUsername("ShadowrunBotTS");
        const guildRecord = await Guild.findOne<IGuild>({ guildId: guildId });
        if (!guildRecord) { 
            console.log(`Could not find guild.`);
            return;
        }
        const guild = await client.guilds.fetch(guildId);
        const leaderboardChannel = guild.channels.cache.get(guildRecord.leaderboardChannelId);
        const queueChannel = guild.channels.cache.get(guildRecord.queueChannelId);
        const matchChannel = guild.channels.cache.get(guildRecord.matchChannelId);
        await (leaderboardChannel as TextChannel).messages.fetch({ cache: true });
        await (queueChannel as TextChannel).messages.fetch({ cache: true });
        await (matchChannel as TextChannel).messages.fetch({ cache: true });
        console.log(`Ready!!! ${client.user?.tag} is logged in and online.`);
    }
}

export default event;