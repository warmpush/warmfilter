import type { Message } from 'discord.js';
import { MessageEmbed } from 'discord.js';

import { client } from './client';

const regEx = /\n/gimu;

export const sanitizeMessage = (content: string): string =>
  content.replace(regEx, '');

type LinkMeta = {
  guildId: string;
  messageId: string;
  channelId: string;
};

const createLink = ({ guildId, channelId, messageId }: LinkMeta): string =>
  `https://discordapp.com/channels/${guildId}/${channelId}/${messageId}`;

interface Meta {
  msg: Message;
  content: string;
  link: string;
}

export const createUrlAwareMessage = ({ msg, content, link }: Meta): string => `
  **${msg.author.username} wrote:**
  > ${content}
  
  jump: ${link}
  `;

export const createEmbed = ({
  msg,
  content,
  link,
}: Meta): { embed: MessageEmbed } => {
  const embed = new MessageEmbed();

  embed.addFields([
    {
      name: `${msg.author.username} wrote`,
      value: content || 'attachment',
    },
    {
      name: 'Original',
      value: createMarkdownLink(link),
    },
  ]);

  embed.setTimestamp(msg.createdTimestamp);
  embed.setURL(link);

  const image = msg.attachments.first()?.url;

  if (image) {
    embed.setImage(image);
  }

  return { embed };
};

const createMarkdownLink = (link: string) => `[jump](${link})`;

const containsUrl = (str: string) =>
  ['https://', 'www.', 'http://'].some(key => str.includes(key));

const containsImage = (msg: Message) => !!msg.attachments.first()?.url;

type ResponseMeta = {
  content: string;
  msg: Message;
};

export const createResponse = ({
  content,
  msg,
}: ResponseMeta): string | { embed: MessageEmbed } => {
  const link = createLink({
    channelId: msg.channel.id,
    guildId: msg.guild?.id ?? client.guilds.cache.array()[0].id,
    messageId: msg.id,
  });

  if (containsImage(msg) && !containsUrl(content)) {
    return createEmbed({ content, link, msg });
  }

  return createUrlAwareMessage({ content, link, msg });
};
