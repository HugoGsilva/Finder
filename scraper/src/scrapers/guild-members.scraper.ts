import * as cheerio from 'cheerio';
import { BaseScraper, ScraperResult } from './base.scraper';
import { getRubinothingsClient } from '../http';
import { ScraperConfig, ScrapedGuildMember } from '../types';
import { ParserUtils } from '../utils/parser.utils';
import { getPool } from '../database';
import { logger } from '../utils/logger';

export interface GuildMembersData {
  guildId: string;
  guildName: string;
  serverId: string;
  serverName: string;
  members: ScrapedGuildMember[];
}

export class GuildMembersScraper extends BaseScraper<GuildMembersData[]> {
  constructor(config?: Partial<ScraperConfig>) {
    const defaultConfig: ScraperConfig = {
      interval: 12 * 60 * 60 * 1000, // 12 hours
      retryAttempts: 3,
      timeout: 30000,
      enabled: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    super(
      'GuildMembersScraper',
      getRubinothingsClient(),
      { ...defaultConfig, ...config }
    );
  }

  async scrape(): Promise<ScraperResult<GuildMembersData[]>> {
    const pool = getPool();
    const results: GuildMembersData[] = [];

    try {
      // Get all configured guilds from database
      const guildsQuery = await pool.query(`
        SELECT g.id, g.name, g.server_id, s.name as server_name
        FROM guilds g
        INNER JOIN servers s ON g.server_id = s.id
        ORDER BY s.name, g.name
      `);

      if (guildsQuery.rows.length === 0) {
        logger.warn('No guilds configured for scraping');
        return { success: true, data: [] };
      }

      logger.info(`Scraping ${guildsQuery.rows.length} guilds...`);

      // Process each guild
      for (const guildRow of guildsQuery.rows) {
        try {
          const members = await this.scrapeGuildMembers(
            guildRow.server_name,
            guildRow.name
          );

          // Property 2: Guild data persistence includes timestamp
          // Store snapshot with timestamp
          const snapshotTime = new Date();
          for (const member of members) {
            await pool.query(
              `INSERT INTO guild_member_snapshots (guild_id, player_name, vocation, snapshot_time)
               VALUES ($1, $2, $3, $4)`,
              [guildRow.id, member.name, member.vocation, snapshotTime]
            );

            // Upsert player
            await pool.query(
              `INSERT INTO players (name, vocation, level, server_id, guild_id)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (name, server_id)
               DO UPDATE SET 
                 vocation = $2,
                 guild_id = $5,
                 updated_at = NOW()`,
              [member.name, member.vocation, 1, guildRow.server_id, guildRow.id]
            );
          }

          results.push({
            guildId: guildRow.id,
            guildName: guildRow.name,
            serverId: guildRow.server_id,
            serverName: guildRow.server_name,
            members,
          });

          logger.info(`Scraped ${members.length} members from guild ${guildRow.name}`);

          // Random delay between guilds
          await this.delay(ParserUtils.getRandomDelay(1000, 2000));
        } catch (error) {
          logger.error(`Failed to scrape guild ${guildRow.name}:`, error);
          // Continue with next guild
        }
      }

      return { success: true, data: results };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Guild members scraping failed:', error);
      return { success: false, error: errorMessage };
    }
  }

  private async scrapeGuildMembers(
    serverName: string,
    guildName: string
  ): Promise<ScrapedGuildMember[]> {
    const members: ScrapedGuildMember[] = [];

    // Step 1: Navigate to guilds page with server selection
    const guildsPageUrl = '/?subtopic=guilds';
    const guildsPayload = ParserUtils.buildServerPayload(serverName);

    const guildsResponse = await this.httpClient.post(guildsPageUrl, guildsPayload);
    
    if (guildsResponse.status !== 200) {
      throw new Error(`Failed to load guilds page: ${guildsResponse.status}`);
    }

    // Parse guilds list to find the target guild link
    const $ = cheerio.load(guildsResponse.data);
    
    // Find the guild link (structure may vary, adjust selector as needed)
    let guildUrl: string | undefined;
    $('a').each((_index: number, element: cheerio.Element) => {
      const linkText = $(element).text().trim();
      if (linkText === guildName) {
        guildUrl = $(element).attr('href');
        return false; // break
      }
      return true;
    });

    if (!guildUrl) {
      logger.warn(`Guild ${guildName} not found on server ${serverName}`);
      return members;
    }

    // Step 2: Navigate to specific guild page
    await this.delay(ParserUtils.getRandomDelay(500, 1000));
    const guildResponse = await this.httpClient.get(guildUrl);

    if (guildResponse.status !== 200) {
      throw new Error(`Failed to load guild page: ${guildResponse.status}`);
    }

    // Step 3: Parse guild members
    const $guild = cheerio.load(guildResponse.data);

    // Find the members table (adjust selectors based on actual HTML structure)
    // Typical structure: table with rows containing player name and vocation
    $guild('table tr').each((index: number, row: cheerio.Element) => {
      if (index === 0) return; // Skip header row

      const cells = $guild(row).find('td');
      if (cells.length < 2) return;

      try {
        // Extract player name from first cell
        const fullName = $guild(cells[0]).text().trim();
        
        // Property 1: Player name parsing excludes titles
        const playerName = ParserUtils.parsePlayerName(fullName);
        
        // Extract vocation from second cell (or appropriate cell)
        const vocationText = $guild(cells[1]).text().trim();
        const vocation = ParserUtils.parseVocation(vocationText);

        if (playerName) {
          members.push({
            name: playerName,
            vocation,
          });
        }
      } catch (error) {
        logger.warn(`Failed to parse member row:`, error);
        // Skip invalid rows
      }
    });

    return members;
  }
}
