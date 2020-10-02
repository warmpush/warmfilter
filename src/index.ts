import { Client, GuildChannel, Message, MessageEmbed } from 'discord.js';

const IS_PROD = process.env.NODE_ENV === 'production';
const TOKEN = IS_PROD ? process.env.DISCORD_TOKEN : process.env.DUMMY_TOKEN;
// eslint-disable-next-line prefer-destructuring, @typescript-eslint/no-non-null-assertion
const KEYWORDS = process.env.KEYWORDS!.split(',');
// eslint-disable-next-line prefer-destructuring, @typescript-eslint/no-non-null-assertion
const TARGET_CHANNEL = process.env.TARGET_CHANNEL!;

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

interface EmbedMeta {
  msg: Message;
  content: string;
}

const createEmbed = ({ msg, content }: EmbedMeta): MessageEmbed => {
  const embed = new MessageEmbed();

  const link = createLink({
    channelId: msg.channel.id,
    guildId: msg.guild?.id ?? client.guilds.cache.array()[0].id,
    messageId: msg.id,
  });

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

  const url = msg.attachments.first()?.url;

  if (url) {
    embed.setImage(url);
  }

  return embed;
};

interface TargetChannel extends GuildChannel {
  send?: (message: { embed: MessageEmbed }) => Promise<Message>;
}

const isRelevantMessage = (content: string) =>
  KEYWORDS.some(keyword => content.includes(keyword));

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on('message', async msg => {
  try {
    const content = msg.cleanContent.replace(/\n/gimu, ' ').toLowerCase();
    const hasAttachment = msg.attachments.size > 0;

    if (!msg.guild || (!hasAttachment && !isRelevantMessage(content))) {
      return;
    }

    const targetChannel = msg.guild.channels.cache.find(
      channel => channel.name === TARGET_CHANNEL
    ) as TargetChannel;

    if (!targetChannel?.send) {
      // eslint-disable-next-line no-console
      console.error(`Could not find channel with name "${TARGET_CHANNEL}"`);
      return;
    }

    const embed = createEmbed({ content, msg });

    await targetChannel.send({ embed });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
});
