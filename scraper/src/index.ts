import dotenv from 'dotenv';
import { getScheduler } from './scheduler.service';
import { closePool } from './database';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('Guild Monitor Scraper Service starting...');

  const scheduler = getScheduler();
  scheduler.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    scheduler.stop();
    await closePool();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    scheduler.stop();
    await closePool();
    process.exit(0);
  });

  logger.info('Scraper service is running');
}

main().catch((error) => {
  logger.error('Fatal error in scraper service:', error);
  process.exit(1);
});
