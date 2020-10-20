import type { GuildChannel, Message, MessageEmbed } from 'discord.js';

export type TargetChannel = GuildChannel & {
  send?: (message: string | { embed: MessageEmbed }) => Promise<Message>;
};
