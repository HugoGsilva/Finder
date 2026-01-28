import { getPool } from '../database';
import { ScraperStatus } from '../types';
import { logger } from '../utils/logger';

export interface ScraperLogEntry {
  scraperType: string;
  status: ScraperStatus;
  message?: string;
  executionTime?: number;
}

export class ScraperLogger {
  async log(entry: ScraperLogEntry): Promise<void> {
    const pool = getPool();
    
    try {
      await pool.query(
        'INSERT INTO scraper_logs (scraper_type, status, message, execution_time) VALUES ($1, $2, $3, $4)',
        [entry.scraperType, entry.status, entry.message || null, entry.executionTime || null]
      );
      
      if (entry.status === ScraperStatus.ERROR) {
        logger.error(`[${entry.scraperType}] ${entry.message}`);
      } else if (entry.status === ScraperStatus.WARNING) {
        logger.warn(`[${entry.scraperType}] ${entry.message}`);
      } else {
        logger.info(`[${entry.scraperType}] ${entry.message || 'Success'}`);
      }
    } catch (error) {
      logger.error('Failed to write scraper log to database', error);
    }
  }

  async logSuccess(scraperType: string, message: string, executionTime?: number): Promise<void> {
    await this.log({
      scraperType,
      status: ScraperStatus.SUCCESS,
      message,
      executionTime,
    });
  }

  async logError(scraperType: string, error: Error | string, executionTime?: number): Promise<void> {
    const message = error instanceof Error ? error.message : error;
    await this.log({
      scraperType,
      status: ScraperStatus.ERROR,
      message,
      executionTime,
    });
  }

  async logWarning(scraperType: string, message: string, executionTime?: number): Promise<void> {
    await this.log({
      scraperType,
      status: ScraperStatus.WARNING,
      message,
      executionTime,
    });
  }
}

let scraperLoggerInstance: ScraperLogger | null = null;

export function getScraperLogger(): ScraperLogger {
  if (!scraperLoggerInstance) {
    scraperLoggerInstance = new ScraperLogger();
  }
  return scraperLoggerInstance;
}
