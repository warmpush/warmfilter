import type { Message } from 'discord.js';

import { client } from '../client';
import actSymbolsRaw from '../grouped.json';
import type { TargetChannel } from '../types';
import { createResponse, sanitizeMessage } from '../utils';

const actSymbols = new Set<string>(actSymbolsRaw);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const TARGET_CHANNEL = process.env.NYSE_TARGET_CHANNEL!;

const isRelevantMessage = (content: string): boolean =>
  content.split(' ').some(word => actSymbols.has(word));

export const nyseListener = async (msg: Message): Promise<void> => {
  try {
    if (msg.author.id === client?.user?.id || !msg.guild) {
      return;
    }

    const targetChannel = msg.guild.channels.cache.find(
      channel => channel.id === TARGET_CHANNEL
    ) as TargetChannel;

    if (!targetChannel?.send) {
      // eslint-disable-next-line no-console
      console.error(`Could not find channel with id "${TARGET_CHANNEL}"`);
      return;
    }

    const content = sanitizeMessage(msg.cleanContent);

    if (!isRelevantMessage(content)) {
      return;
    }

    const response = createResponse({
      content,
      msg,
    });

    await targetChannel.send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
