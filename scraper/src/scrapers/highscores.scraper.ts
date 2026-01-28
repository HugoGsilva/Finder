import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './base.scraper';
import { getRubinothingsClient } from '../http';
import { ScraperConfig, ScrapedHighscoreEntry } from '../types';
import { ParserUtils } from '../utils/parser.utils';
import { getPool } from '../database';
import { logger } from '../utils/logger';

export interface HighscoresData {
  serverId: string;
  serverName: string;
  entries: ScrapedHighscoreEntry[];
}

export class HighscoresScraper extends BaseScraper<HighscoresData[]> {
  private readonly MIN_PAGES = 15;

  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      interval: 60 * 1000, // 60 seconds (1 minute)
      retryAttempts: 3,
      timeout: 30000,
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    super(
      'HighscoresScraper',
      getRubinothingsClient(),
      { ...defaultConfig, ...config }
    );
  }

  async scrape(): Promise<ScraperResult<HighscoresData[]>> {
    const pool = getPool();
    const results: HighscoresData[] = [];

    try {
      // Get all servers
      const serversQuery = await pool.query('SELECT id, name FROM servers ORDER BY name');

      if (serversQuery.rows.length === 0) {
        return { success: true, data: [] };
      }

      // Process each server
      for (const server of serversQuery.rows) {
        try {
          const entries = await this.scrapeHighscores(server.name);

          // Process each player entry
          for (const entry of entries) {
            // Update player level and XP
            const playerResult = await pool.query(
              `INSERT INTO players (name, vocation, level, server_id)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (name, server_id)
               DO UPDATE SET level = $3, updated_at = NOW()
               RETURNING id`,
              [entry.name, 'None', entry.level, server.id]
            );

            const playerId = playerResult.rows[0].id;

            // Get previous XP snapshot
            const previousSnapshot = await pool.query(
              `SELECT experience, snapshot_time
               FROM xp_snapshots
               WHERE player_id = $1
               ORDER BY snapshot_time DESC
               LIMIT 1`,
              [playerId]
            );

            // Create new snapshot
            await pool.query(
              `INSERT INTO xp_snapshots (player_id, level, experience, snapshot_time)
               VALUES ($1, $2, $3, NOW())`,
              [playerId, entry.level, entry.experience.toString()]
            );

            // Property 10: XP increase triggers hunting status
            if (previousSnapshot.rows.length > 0) {
              const previousXp = BigInt(previousSnapshot.rows[0].experience);
              const previousTime = new Date(previousSnapshot.rows[0].snapshot_time);
              const currentXp = entry.experience;

              // Property 9: XP gain calculation is accurate
              const xpGain = currentXp - previousXp;
              const timeDiff = (Date.now() - previousTime.getTime()) / 1000 / 60; // minutes

              if (xpGain > 0n && timeDiff > 0) {
                // Calculate XP per minute
                const xpPerMinute = Number(xpGain) / timeDiff;

                // Mark as hunting
                await pool.query(
                  `INSERT INTO player_status (player_id, is_hunting)
                   VALUES ($1, true)
                   ON CONFLICT (player_id)
                   DO UPDATE SET is_hunting = true`,
                  [playerId]
                );

                // Update or create hunting session
                const activeSession = await pool.query(
                  `SELECT id, start_time, xp_gained
                   FROM hunting_sessions
                   WHERE player_id = $1 AND is_active = true
                   ORDER BY start_time DESC
                   LIMIT 1`,
                  [playerId]
                );

                if (activeSession.rows.length > 0) {
                  // Update existing session
                  const sessionId = activeSession.rows[0].id;
                  const currentSessionXp = BigInt(activeSession.rows[0].xp_gained || '0');
                  const newTotalXp = currentSessionXp + xpGain;

                  await pool.query(
                    `UPDATE hunting_sessions
                     SET xp_gained = $1
                     WHERE id = $2`,
                    [newTotalXp.toString(), sessionId]
                  );
                } else {
                  // Create new session
                  await pool.query(
                    `INSERT INTO hunting_sessions (player_id, start_time, xp_gained)
                     VALUES ($1, NOW(), $2)`,
                    [playerId, xpGain.toString()]
                  );
                }

                logger.debug(`${entry.name}: +${xpGain} XP (${xpPerMinute.toFixed(0)} XP/min)`);
              } else if (xpGain === 0n) {
                // No XP gain - mark as not hunting
                await pool.query(
                  `INSERT INTO player_status (player_id, is_hunting)
                   VALUES ($1, false)
                   ON CONFLICT (player_id)
                   DO UPDATE SET is_hunting = false`,
                  [playerId]
                );

                // End active session if exists
                await pool.query(
                  `UPDATE hunting_sessions
                   SET is_active = false, end_time = NOW()
                   WHERE player_id = $1 AND is_active = true`,
                  [playerId]
                );
              }
            }
          }

          results.push({
            serverId: server.id,
            serverName: server.name,
            entries,
          });

          logger.info(`Scraped ${entries.length} highscore entries from ${server.name}`);

          await this.delay(ParserUtils.getRandomDelay(1000, 2000));
        } catch (error) {
          logger.error(`Failed to scrape highscores for ${server.name}:`, error);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Highscores scraping failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  private async scrapeHighscores(serverName: string): Promise<ScrapedHighscoreEntry[]> {
    const entries: ScrapedHighscoreEntry[] = [];

    // Scrape minimum 15 pages
    for (let page = 1; page <= this.MIN_PAGES; page++) {
      try {
        const pageEntries = await this.scrapeHighscoresPage(serverName, page);
        entries.push(...pageEntries);

        if (pageEntries.length === 0) {
          break; // No more entries
        }

        // Delay between pages
        await this.delay(ParserUtils.getRandomDelay(300, 800));
      } catch (error) {
        logger.error(`Failed to scrape highscores page ${page}:`, error);
        break;
      }
    }

    return entries;
  }

  private async scrapeHighscoresPage(
    serverName: string,
    page: number
  ): Promise<ScrapedHighscoreEntry[]> {
    const entries: ScrapedHighscoreEntry[] = [];

    const highscoresUrl = '/?subtopic=highscores';
    const payload = ParserUtils.buildHighscoresPayload(serverName, page);

    const response = await this.httpClient.post(highscoresUrl, payload);

    if (response.status !== 200) {
      throw new Error(`Failed to load highscores page ${page}: ${response.status}`);
    }

    const $ = cheerio.load(response.data);

    // Parse highscores table
    $('table tr').each((index: number, row: cheerio.Element) => {
      if (index === 0) return; // Skip header

      const cells = $(row).find('td');
      if (cells.length < 4) return;

      try {
        const rank = parseInt($(cells[0]).text().trim());
        const name = ParserUtils.parsePlayerName($(cells[1]).text().trim());
        const level = ParserUtils.parseLevel($(cells[2]).text().trim());
        
        // Property 5: Support large XP values with BigInt (>12 digits)
        const experienceText = $(cells[3]).text().trim();
        const experience = ParserUtils.parseExperience(experienceText);

        if (name && level > 0 && experience >= 0n) {
          entries.push({
            rank,
            name,
            level,
            experience,
          });
        }
      } catch (error) {
        logger.warn(`Failed to parse highscore row:`, error);
      }
    });

    return entries;
  }
}
