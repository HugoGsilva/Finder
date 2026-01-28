import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './base.scraper';
import { getRubinothingsClient } from '../http';
import { ScraperConfig, ScrapedDeath } from '../types';
import { ParserUtils } from '../utils/parser.utils';
import { getPool } from '../database';
import { logger } from '../utils/logger';

export interface KillboardData {
  serverId: string;
  serverName: string;
  deaths: ScrapedDeath[];
}

export class KillboardScraper extends BaseScraper<KillboardData[]> {
  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      interval: 30 * 1000, // 30 seconds
      retryAttempts: 3,
      timeout: 15000,
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    super(
      'KillboardScraper',
      getRubinothingsClient(),
      { ...defaultConfig, ...config }
    );
  }

  async scrape(): Promise<ScraperResult<KillboardData[]>> {
    const pool = getPool();
    const results: KillboardData[] = [];

    try {
      // Get all servers
      const serversQuery = await pool.query('SELECT id, name FROM servers ORDER BY name');

      if (serversQuery.rows.length === 0) {
        return { success: true, data: [] };
      }

      // Process each server
      for (const server of serversQuery.rows) {
        try {
          const deaths = await this.scrapeKillboard(server.name, server.id);

          // Store new deaths
          // Property 5: Death records contain complete information
          for (const death of deaths) {
            // Check if death already exists
            const existingDeath = await pool.query(
              `SELECT id FROM deaths 
               WHERE victim_name = $1 AND death_time = $2 AND server_id = $3`,
              [death.victimName, death.deathTime, server.id]
            );

            if (existingDeath.rows.length === 0) {
              // Get victim player ID
              const victimQuery = await pool.query(
                `SELECT id FROM players WHERE name = $1 AND server_id = $2`,
                [death.victimName, server.id]
              );

              const victimId = victimQuery.rows.length > 0 ? victimQuery.rows[0].id : null;

              // Check if victim is ally or enemy
              const isAllyDeath = await this.isAllyDeath(death.victimName, server.id);

              await pool.query(
                `INSERT INTO deaths (victim_name, victim_id, killer_name, death_time, server_id, is_ally_death)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [death.victimName, victimId, death.killerName, death.deathTime, server.id, isAllyDeath]
              );

              logger.info(`New death recorded: ${death.victimName} killed by ${death.killerName || 'environment'}`);
            }
          }

          results.push({
            serverId: server.id,
            serverName: server.name,
            deaths,
          });

          logger.info(`Scraped ${deaths.length} deaths from ${server.name}`);

          await this.delay(ParserUtils.getRandomDelay(500, 1000));
        } catch (error) {
          logger.error(`Failed to scrape killboard for ${server.name}:`, error);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Killboard scraping failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  private async scrapeKillboard(serverName: string, _serverId: string): Promise<ScrapedDeath[]> {
    const deaths: ScrapedDeath[] = [];

    // Step 1: Navigate to killboard with server selection
    const killboardUrl = '/?subtopic=latestdeaths';
    const payload = ParserUtils.buildServerPayload(serverName);

    const response = await this.httpClient.post(killboardUrl, payload);

    if (response.status !== 200) {
      throw new Error(`Failed to load killboard: ${response.status}`);
    }

    const $ = cheerio.load(response.data);

    // Parse deaths table
    // Property 5: Death records contain complete information (victim, killer, timestamp)
    $('table tr').each((index: number, row: cheerio.Element) => {
      if (index === 0) return; // Skip header

      const cells = $(row).find('td');
      if (cells.length < 3) return;

      try {
        const victimName = ParserUtils.parsePlayerName($(cells[0]).text().trim());
        const killerName = $(cells[1]).text().trim() || null;
        const timeText = $(cells[2]).text().trim();
        const deathTime = ParserUtils.parseRubinotTime(timeText);

        // Validate completeness
        if (victimName && deathTime) {
          deaths.push({
            victimName,
            killerName,
            deathTime,
          });
        }
      } catch (error) {
        logger.warn(`Failed to parse death row:`, error);
      }
    });

    return deaths;
  }

  // Property 4: Guild classification matches configuration
  private async isAllyDeath(playerName: string, serverId: string): Promise<boolean> {
    const pool = getPool();
    
    const result = await pool.query(
      `SELECT g.is_ally
       FROM players p
       INNER JOIN guilds g ON p.guild_id = g.id
       WHERE p.name = $1 AND p.server_id = $2`,
      [playerName, serverId]
    );

    return result.rows.length > 0 ? result.rows[0].is_ally : false;
  }
}
