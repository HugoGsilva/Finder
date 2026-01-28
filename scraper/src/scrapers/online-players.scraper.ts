import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './base.scraper';
import { getRubinothingsClient } from '../http';
import { ScraperConfig, ScrapedOnlinePlayer } from '../types';
import { ParserUtils } from '../utils/parser.utils';
import { getPool } from '../database';
import { logger } from '../utils/logger';

export interface OnlinePlayersData {
  serverId: string;
  serverName: string;
  onlinePlayers: ScrapedOnlinePlayer[];
}

export class OnlinePlayersScraper extends BaseScraper<OnlinePlayersData[]> {
  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      interval: 30 * 1000, // 30 seconds
      retryAttempts: 3,
      timeout: 15000,
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    super(
      'OnlinePlayersScraper',
      getRubinothingsClient(),
      { ...defaultConfig, ...config }
    );
  }

  async scrape(): Promise<ScraperResult<OnlinePlayersData[]>> {
    const pool = getPool();
    const results: OnlinePlayersData[] = [];

    try {
      // Get all servers
      const serversQuery = await pool.query('SELECT id, name FROM servers ORDER BY name');

      if (serversQuery.rows.length === 0) {
        return { success: true, data: [] };
      }

      // Process each server
      for (const server of serversQuery.rows) {
        try {
          const onlinePlayers = await this.scrapeOnlinePlayers(server.name);

          // Property 6: Online status reflects presence in list
          // Property 7: Status changes trigger immediate updates
          // Mark all players as offline first
          await pool.query(
            `UPDATE player_status ps
             SET is_online = false
             FROM players p
             WHERE ps.player_id = p.id AND p.server_id = $1`,
            [server.id]
          );

          // Update online players
          for (const player of onlinePlayers) {
            // Upsert player
            const playerResult = await pool.query(
              `INSERT INTO players (name, vocation, level, server_id)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (name, server_id)
               DO UPDATE SET level = $3, vocation = $2, updated_at = NOW()
               RETURNING id`,
              [player.name, player.vocation, player.level, server.id]
            );

            const playerId = playerResult.rows[0].id;

            // Update player status - Property 7: immediate update
            await pool.query(
              `INSERT INTO player_status (player_id, is_online, last_seen)
               VALUES ($1, true, NOW())
               ON CONFLICT (player_id)
               DO UPDATE SET is_online = true, last_seen = NOW()`,
              [playerId]
            );
          }

          results.push({
            serverId: server.id,
            serverName: server.name,
            onlinePlayers,
          });

          logger.info(`Found ${onlinePlayers.length} online players on ${server.name}`);

          // Delay between servers
          await this.delay(ParserUtils.getRandomDelay(500, 1000));
        } catch (error) {
          logger.error(`Failed to scrape online players for ${server.name}:`, error);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Online players scraping failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  private async scrapeOnlinePlayers(serverName: string): Promise<ScrapedOnlinePlayer[]> {
    const players: ScrapedOnlinePlayer[] = [];

    // Navigate to worlds page with server parameter
    const worldsUrl = `/?subtopic=worlds&world=${encodeURIComponent(serverName)}`;
    const response = await this.httpClient.get(worldsUrl);

    if (response.status !== 200) {
      throw new Error(`Failed to load worlds page: ${response.status}`);
    }

    const $ = cheerio.load(response.data);

    // Parse online players table
    // Property 8: Online player data is complete (name, level, vocation)
    $('table tr').each((index: number, row: cheerio.Element) => {
      if (index === 0) return; // Skip header

      const cells = $(row).find('td');
      if (cells.length < 3) return;

      try {
        const name = ParserUtils.parsePlayerName($(cells[0]).text().trim());
        const level = ParserUtils.parseLevel($(cells[1]).text().trim());
        const vocationText = $(cells[2]).text().trim();
        const vocation = ParserUtils.parseVocation(vocationText);

        // Validate completeness - Property 8
        if (name && level > 0) {
          players.push({ name, level, vocation });
        }
      } catch (error) {
        logger.warn(`Failed to parse online player row:`, error);
      }
    });

    return players;
  }
}
