import { Client, GuildChannel, Message, MessageEmbed } from 'discord.js';

const IS_PROD = process.env.NODE_ENV === 'production';
const TOKEN = IS_PROD ? process.env.DISCORD_TOKEN : process.env.DUMMY_TOKEN;
const KEYWORDS = process.env.KEYWORDS?.split(',') ?? [];
// eslint-disable-next-line prefer-destructuring, @typescript-eslint/no-non-null-assertion
const TARGET_CHANNEL = process.env.TARGET_CHANNEL!;
const DENYLIST = process.env.DENYLIST?.split(',') ?? [];

const client = new Client();

client.on('ready', () => {
  if (client.user) {
    // eslint-disable-next-line no-console
    console.log(
      `Logged in as ${client.user.tag}!\nEnvironment: ${
        process.env.NODE_ENV ?? 'unknown env'
      }`
    );
  }
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await client.login(TOKEN);
  } catch {
    // eslint-disable-next-line no-console
    console.error('Boot Error: token invalid');
  }
})();

interface LinkMeta {
  guildId: string;
  messageId: string;
  channelId: string;
}

const createLink = ({ guildId, channelId, messageId }: LinkMeta) =>
  `https://discordapp.com/channels/${guildId}/${channelId}/${messageId}`;

const createMarkdownLink = (link: string) => `[jump](${link})`;

interface Meta {
  msg: Message;
  content: string;
  link: string;
}

const containsUrl = (str: string) =>
  ['https://', 'www.', 'http://'].some(key => str.includes(key));

const createEmbed = ({ msg, content, link }: Meta): { embed: MessageEmbed } => {
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

 // if (image) {
   // embed.setImage(image);
 // }

  return { embed };
};

const createUrlAwareMessage = ({ msg, content, link }: Meta): string => `
**${msg.author.username} wrote:**
> ${content}

jump: ${link}
`;

interface TargetChannel extends GuildChannel {
  send?: (message: string | { embed: MessageEmbed }) => Promise<Message>;
}

const atLeastTwoUpperCaseCharactersRegEx = /[A-Z]{2,}/gu;

const isRelevantMessage = (content: string) => {
  if (DENYLIST.some(denied => content.includes(denied))) {
    return false;
  }

  if (KEYWORDS.some(keyword => content.includes(keyword))) {
    return true;
  }

  const matches = content.match(atLeastTwoUpperCaseCharactersRegEx)?.length;

  return matches && matches >= 1;
};

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on('message', async msg => {
  try {
    if (msg.author.id === client?.user?.id) {
      return;
    }

    const content = msg.cleanContent.replace(/\n/gimu, ' ');
    const hasAttachment = msg.attachments.size > 0;

    if (!msg.guild || (!hasAttachment && !isRelevantMessage(content))) {
      return;
    }

    const targetChannel = msg.guild.channels.cache.find(
      channel => channel.id === TARGET_CHANNEL
    ) as TargetChannel;

    if (!targetChannel?.send) {
      // eslint-disable-next-line no-console
      console.error(`Could not find channel with name "${TARGET_CHANNEL}"`);
      return;
    }

    const hasUrl = containsUrl(content);

    const link = createLink({
      channelId: msg.channel.id,
      guildId: msg.guild?.id ?? client.guilds.cache.array()[0].id,
      messageId: msg.id,
    });

    const response = hasUrl
      ? createUrlAwareMessage({ content, link, msg })
      : createEmbed({ content, link, msg });

    await targetChannel.send(response);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
});
