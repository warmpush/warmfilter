import type { Message } from 'discord.js';

import { client } from '../client';
import type { TargetChannel } from '../types';
import { sanitizeMessage, createResponse } from '../utils';

const KEYWORDS = process.env.KEYWORDS?.split(',') ?? [];
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const TARGET_CHANNEL = process.env.REGULAR_TARGET_CHANNEL!;
const DENYLIST = process.env.DENYLIST?.split(',') ?? [];

const isRelevantMessage = (content: string) => {
  if (DENYLIST.some(denied => content.includes(denied))) {
    return false;
  }

  return KEYWORDS.some(keyword => content.includes(keyword));
};

export const otherListener = async (msg: Message): Promise<void> => {
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
    const hasAttachment = false;

    if (!hasAttachment && !isRelevantMessage(content)) {
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
