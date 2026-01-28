import { HttpClient } from '../http';
import { getScraperLogger } from '../utils/scraper-logger';
import { ScraperConfig } from '../types';
import { logger } from '../utils/logger';

export interface ScraperResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export abstract class BaseScraper<T> {
  protected name: string;
  protected httpClient: HttpClient;
  protected config: ScraperConfig;
  protected isRunning: boolean = false;
  protected lastRun: Date | null = null;
  protected nextRun: Date | null = null;

  constructor(name: string, httpClient: HttpClient, config: ScraperConfig) {
    this.name = name;
    this.httpClient = httpClient;
    this.config = config;
  }

  abstract scrape(): Promise<ScraperResult<T>>;

  async execute(): Promise<ScraperResult<T>> {
    if (this.isRunning) {
      logger.warn(`${this.name} is already running, skipping...`);
      return { success: false, error: 'Scraper is already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    const scraperLogger = getScraperLogger();

    try {
      logger.info(`${this.name} started`);
      
      const result = await this.scrapeWithRetry();
      
      const executionTime = Date.now() - startTime;
      this.lastRun = new Date();
      
      if (result.success) {
        await scraperLogger.logSuccess(this.name, 'Scraping completed successfully', executionTime);
        logger.info(`${this.name} completed in ${executionTime}ms`);
      } else {
        await scraperLogger.logError(this.name, result.error || 'Unknown error', executionTime);
      }
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await scraperLogger.logError(this.name, errorMessage, executionTime);
      logger.error(`${this.name} failed:`, error);
      
      return { success: false, error: errorMessage };
    } finally {
      this.isRunning = false;
      this.scheduleNextRun();
    }
  }

  private async scrapeWithRetry(): Promise<ScraperResult<T>> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.scrape();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`${this.name} attempt ${attempt}/${this.config.retryAttempts} failed: ${lastError.message}`);

        if (attempt < this.config.retryAttempts) {
          const backoffDelay = this.getExponentialBackoff(attempt);
          logger.info(`${this.name} retrying in ${backoffDelay}ms...`);
          await this.delay(backoffDelay);
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
    };
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected getExponentialBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
  }

  protected scheduleNextRun(): void {
    if (this.config.interval > 0) {
      this.nextRun = new Date(Date.now() + this.config.interval);
    }
  }

  getStatus(): {
    name: string;
    isRunning: boolean;
    lastRun: Date | null;
    nextRun: Date | null;
    enabled: boolean;
  } {
    return {
      name: this.name,
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      enabled: this.config.enabled,
    };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  getInterval(): number {
    return this.config.interval;
  }

  getLastRun(): Date | null {
    return this.lastRun;
  }

  getNextRun(): Date | null {
    return this.nextRun;
  }
}
