import { client } from './client';
import { nyseListener } from './listeners/nyse';
import { otherListener } from './listeners/other';

const IS_PROD = process.env.NODE_ENV === 'production';
const TOKEN = IS_PROD ? process.env.DISCORD_TOKEN : process.env.DUMMY_TOKEN;

client.on('ready', () => {
  if (client.user) {
    // eslint-disable-next-line no-console
    console.log(
      `Logged in as ${client.user.tag}!\nEnvironment: ${
        process.env.NODE_ENV ?? 'unknown env'
      }`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  client.on('message', otherListener);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  client.on('message', nyseListener);
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
