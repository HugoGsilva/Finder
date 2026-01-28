import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './base.scraper';
import { getRubinothingsHistoryClient } from '../http';
import { ScraperConfig } from '../types';
import { ParserUtils } from '../utils/parser.utils';
import { getPool } from '../database';
import { logger } from '../utils/logger';

export interface PlaytimeData {
  playerId: string;
  playerName: string;
  patterns: Array<{
    hourOfDay: number;
    dayOfWeek: number;
    frequency: number;
  }>;
}

export class PlaytimeScraper extends BaseScraper<PlaytimeData[]> {
  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      interval: 12 * 60 * 60 * 1000, // 12 hours
      retryAttempts: 3,
      timeout: 30000,
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    super(
      'PlaytimeScraper',
      getRubinothingsHistoryClient(),
      { ...defaultConfig, ...config }
    );
  }

  async scrape(): Promise<ScraperResult<PlaytimeData[]>> {
    const pool = getPool();
    const results: PlaytimeData[] = [];

    try {
      // Get all players from configured guilds
      const playersQuery = await pool.query(`
        SELECT DISTINCT p.id, p.name
        FROM players p
        INNER JOIN guilds g ON p.guild_id = g.id
        WHERE g.id IS NOT NULL
        ORDER BY p.name
        LIMIT 100
      `);

      if (playersQuery.rows.length === 0) {
        return { success: true, data: [] };
      }

      logger.info(`Scraping playtime for ${playersQuery.rows.length} players...`);

      // Process each player
      for (const player of playersQuery.rows) {
        try {
          const patterns = await this.scrapePlaytime(player.name);

          if (patterns.length > 0) {
            // Property 12: Playtime pattern identification
            // Property 13: Playtime data persistence
            for (const pattern of patterns) {
              await pool.query(
                `INSERT INTO playtime_patterns (player_id, hour_of_day, day_of_week, frequency)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (player_id, hour_of_day, day_of_week)
                 DO UPDATE SET 
                   frequency = playtime_patterns.frequency + $4,
                   last_updated = NOW()`,
                [player.id, pattern.hourOfDay, pattern.dayOfWeek, pattern.frequency]
              );
            }

            results.push({
              playerId: player.id,
              playerName: player.name,
              patterns,
            });

            logger.info(`Scraped playtime patterns for ${player.name}: ${patterns.length} entries`);
          }

          // Delay between players
          await this.delay(ParserUtils.getRandomDelay(2000, 4000));
        } catch (error) {
          logger.error(`Failed to scrape playtime for ${player.name}:`, error);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Playtime scraping failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  private async scrapePlaytime(playerName: string): Promise<Array<{
    hourOfDay: number;
    dayOfWeek: number;
    frequency: number;
  }>> {
    const patterns: Array<{ hourOfDay: number; dayOfWeek: number; frequency: number }> = [];

    // Navigate to rubinothings with player name
    const url = `/character/${encodeURIComponent(playerName)}`;
    
    try {
      const response = await this.httpClient.get(url);

      if (response.status !== 200) {
        throw new Error(`Failed to load player page: ${response.status}`);
      }

      const $ = cheerio.load(response.data);

      // Find "Histórico de tempo online" section
      // This will need to be adjusted based on actual HTML structure
      let playtimeSection = $('h3:contains("Online Time History")').parent();
      
      if (playtimeSection.length === 0) {
        playtimeSection = $('h3:contains("Histórico")').parent();
      }

      if (playtimeSection.length === 0) {
        logger.warn(`No playtime history found for ${playerName}`);
        return patterns;
      }

      // Parse playtime data
      // Expected format: table or list with timestamps
      playtimeSection.find('table tr').each((index: number, row: cheerio.Element) => {
        if (index === 0) return; // Skip header

        const cells = $(row).find('td');
        if (cells.length < 2) return;

        try {
          const dateText = $(cells[0]).text().trim();
          const date = ParserUtils.parseRubinotTime(dateText);

          if (date) {
            const hourOfDay = date.getHours();
            const dayOfWeek = date.getDay();

            // Find or create pattern
            const existingPattern = patterns.find(
              p => p.hourOfDay === hourOfDay && p.dayOfWeek === dayOfWeek
            );

            if (existingPattern) {
              existingPattern.frequency++;
            } else {
              patterns.push({
                hourOfDay,
                dayOfWeek,
                frequency: 1,
              });
            }
          }
        } catch (error) {
          logger.warn(`Failed to parse playtime row:`, error);
        }
      });
    } catch (error) {
      // Player might not exist on rubinothings
      if (error instanceof Error && error.message.includes('404')) {
        logger.debug(`Player ${playerName} not found on rubinothings`);
      } else {
        throw error;
      }
    }

    return patterns;
  }
}
