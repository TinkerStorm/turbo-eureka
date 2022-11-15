// #region Imports

// Node
import path from 'node:path';

// Packages
import dotenv from 'dotenv';
import { SlashCreator, FastifyServer } from 'slash-create';

// (Configuration)
// - logger requires `COMMAND_DEBUG` to be set
let dotenvPath = path.join(process.cwd(), '.env');
if (path.parse(process.cwd()).name === 'dist') dotenvPath = path.join(process.cwd(), '..', '.env');
dotenv.config({ path: dotenvPath });

// Local
import logger from './util/logger';
import { registerListener } from './components';

// #endregion

const creator = new SlashCreator({
  applicationID: process.env.DISCORD_APP_ID,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  token: process.env.DISCORD_BOT_TOKEN,
  serverPort: parseInt(process.env.PORT, 10) || 8020,
  serverHost: '0.0.0.0'
});

registerListener(creator);

creator.on('debug', (message) => logger.log(message));
creator.on('warn', (message) => logger.warn(message));
creator.on('error', (error) => logger.error(error));
creator.on('synced', () => logger.info('Commands synced!'));
creator.on('commandRun', (command, _, ctx) =>
  logger.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`)
);
creator.on('commandRegister', (command) => logger.info(`Registered command ${command.commandName}`));
creator.on('commandError', (command, error) => logger.error(`Command ${command.commandName}:`, error));

creator
  .withServer(new FastifyServer())
  .registerCommandsIn(path.join(__dirname, 'commands'))
  .startServer();

logger.info(`Starting server at "localhost:${creator.options.serverPort}/interactions"`);
