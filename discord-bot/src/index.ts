import dotenv from 'dotenv';
import { getDiscordBot } from './bot.service';
import { closePool } from './database';
import { logger } from './utils/logger';

dotenv.config();

async function main() {
  logger.info('Guild Monitor Discord Bot starting...');

  const bot = getDiscordBot();
  await bot.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await bot.stop();
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await bot.stop();
    await closePool();
    process.exit(0);
  });

  logger.info('Discord bot is running');
}

main().catch((error) => {
  logger.error('Fatal error in Discord bot:', error);
  process.exit(1);
});
