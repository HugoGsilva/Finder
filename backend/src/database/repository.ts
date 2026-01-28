import { Pool } from 'pg';
import { getPool } from './connection';
import { 
  Server, 
  ServerType,
  Guild, 
  Player, 
  PlayerStatus,
  PlayerWithStatus,
  XpSnapshot,
  HuntingSession,
  Death,
  PlaytimePattern,
  User,
  DiscordConfig,
  ScraperLog,
  GuildMemberSnapshot,
  Vocation,
  NotificationType,
  ScraperStatus
} from '../types';

// Helper to map database rows to TypeScript models
function mapRowToServer(row: Record<string, unknown>): Server {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as ServerType,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToGuild(row: Record<string, unknown>): Guild {
  return {
    id: row.id as string,
    name: row.name as string,
    serverId: row.server_id as string,
    isAlly: row.is_ally as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    vocation: row.vocation as Vocation,
    level: row.level as number,
    guildId: row.guild_id as string | null,
    serverId: row.server_id as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapRowToPlayerStatus(row: Record<string, unknown>): PlayerStatus {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    isOnline: row.is_online as boolean,
    isHunting: row.is_hunting as boolean,
    lastSeen: row.last_seen ? new Date(row.last_seen as string) : null,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToXpSnapshot(row: Record<string, unknown>): XpSnapshot {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    level: row.level as number,
    experience: BigInt(row.experience as string),
    snapshotTime: new Date(row.snapshot_time as string),
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToHuntingSession(row: Record<string, unknown>): HuntingSession {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    startTime: new Date(row.start_time as string),
    endTime: row.end_time ? new Date(row.end_time as string) : null,
    xpGained: BigInt(row.xp_gained as string || '0'),
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToDeath(row: Record<string, unknown>): Death {
  return {
    id: row.id as string,
    victimName: row.victim_name as string,
    victimId: row.victim_id as string | null,
    killerName: row.killer_name as string | null,
    deathTime: new Date(row.death_time as string),
    serverId: row.server_id as string,
    isAllyDeath: row.is_ally_death as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToPlaytimePattern(row: Record<string, unknown>): PlaytimePattern {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    hourOfDay: row.hour_of_day as number,
    dayOfWeek: row.day_of_week as number,
    frequency: row.frequency as number,
    lastUpdated: new Date(row.last_updated as string),
  };
}

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    username: row.username as string,
    passwordHash: row.password_hash as string,
    isAdmin: row.is_admin as boolean,
    isApproved: row.is_approved as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToDiscordConfig(row: Record<string, unknown>): DiscordConfig {
  return {
    id: row.id as string,
    discordGuildId: row.discord_guild_id as string,
    channelId: row.channel_id as string,
    notificationType: row.notification_type as NotificationType,
    isEnabled: row.is_enabled as boolean,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToScraperLog(row: Record<string, unknown>): ScraperLog {
  return {
    id: row.id as string,
    scraperType: row.scraper_type as string,
    status: row.status as ScraperStatus,
    message: row.message as string | null,
    executionTime: row.execution_time as number | null,
    createdAt: new Date(row.created_at as string),
  };
}

function mapRowToGuildMemberSnapshot(row: Record<string, unknown>): GuildMemberSnapshot {
  return {
    id: row.id as string,
    guildId: row.guild_id as string,
    playerName: row.player_name as string,
    vocation: row.vocation as string,
    snapshotTime: new Date(row.snapshot_time as string),
    createdAt: new Date(row.created_at as string),
  };
}

// Repository class for database operations
export class Repository {
  private pool: Pool;

  constructor() {
    this.pool = getPool();
  }

  // Server operations
  async getAllServers(): Promise<Server[]> {
    const result = await this.pool.query('SELECT * FROM servers ORDER BY name');
    return result.rows.map(mapRowToServer);
  }

  async getServerById(id: string): Promise<Server | null> {
    const result = await this.pool.query('SELECT * FROM servers WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapRowToServer(result.rows[0]) : null;
  }

  async getServerByName(name: string): Promise<Server | null> {
    const result = await this.pool.query('SELECT * FROM servers WHERE name = $1', [name]);
    return result.rows.length > 0 ? mapRowToServer(result.rows[0]) : null;
  }

  // Guild operations
  async getAllGuilds(serverId?: string): Promise<Guild[]> {
    let query = 'SELECT * FROM guilds';
    const params: string[] = [];
    
    if (serverId) {
      query += ' WHERE server_id = $1';
      params.push(serverId);
    }
    
    query += ' ORDER BY name';
    const result = await this.pool.query(query, params);
    return result.rows.map(mapRowToGuild);
  }

  async getGuildById(id: string): Promise<Guild | null> {
    const result = await this.pool.query('SELECT * FROM guilds WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapRowToGuild(result.rows[0]) : null;
  }

  async getGuildByNameAndServer(name: string, serverId: string): Promise<Guild | null> {
    const result = await this.pool.query(
      'SELECT * FROM guilds WHERE name = $1 AND server_id = $2',
      [name, serverId]
    );
    return result.rows.length > 0 ? mapRowToGuild(result.rows[0]) : null;
  }

  async createGuild(name: string, serverId: string, isAlly: boolean): Promise<Guild> {
    const result = await this.pool.query(
      'INSERT INTO guilds (name, server_id, is_ally) VALUES ($1, $2, $3) RETURNING *',
      [name, serverId, isAlly]
    );
    return mapRowToGuild(result.rows[0]);
  }

  async updateGuild(id: string, updates: { name?: string; isAlly?: boolean }): Promise<Guild | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      params.push(updates.name);
    }
    if (updates.isAlly !== undefined) {
      setClauses.push(`is_ally = $${paramIndex++}`);
      params.push(updates.isAlly);
    }

    params.push(id);
    const result = await this.pool.query(
      `UPDATE guilds SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows.length > 0 ? mapRowToGuild(result.rows[0]) : null;
  }

  async deleteGuild(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM guilds WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getAllyGuilds(serverId: string): Promise<Guild[]> {
    const result = await this.pool.query(
      'SELECT * FROM guilds WHERE server_id = $1 AND is_ally = true ORDER BY name',
      [serverId]
    );
    return result.rows.map(mapRowToGuild);
  }

  async getEnemyGuilds(serverId: string): Promise<Guild[]> {
    const result = await this.pool.query(
      'SELECT * FROM guilds WHERE server_id = $1 AND is_ally = false ORDER BY name',
      [serverId]
    );
    return result.rows.map(mapRowToGuild);
  }

  // Player operations
  async getPlayerById(id: string): Promise<Player | null> {
    const result = await this.pool.query('SELECT * FROM players WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapRowToPlayer(result.rows[0]) : null;
  }

  async getPlayerByNameAndServer(name: string, serverId: string): Promise<Player | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE name = $1 AND server_id = $2',
      [name, serverId]
    );
    return result.rows.length > 0 ? mapRowToPlayer(result.rows[0]) : null;
  }

  async getPlayersByGuild(guildId: string): Promise<Player[]> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE guild_id = $1 ORDER BY level DESC, name',
      [guildId]
    );
    return result.rows.map(mapRowToPlayer);
  }

  async getPlayersByServer(serverId: string): Promise<Player[]> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE server_id = $1 ORDER BY level DESC, name',
      [serverId]
    );
    return result.rows.map(mapRowToPlayer);
  }

  async createPlayer(
    name: string, 
    vocation: Vocation, 
    level: number, 
    serverId: string, 
    guildId?: string
  ): Promise<Player> {
    const result = await this.pool.query(
      'INSERT INTO players (name, vocation, level, server_id, guild_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, vocation, level, serverId, guildId || null]
    );
    return mapRowToPlayer(result.rows[0]);
  }

  async upsertPlayer(
    name: string, 
    vocation: Vocation, 
    level: number, 
    serverId: string, 
    guildId?: string
  ): Promise<Player> {
    const result = await this.pool.query(
      `INSERT INTO players (name, vocation, level, server_id, guild_id) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name, server_id) 
       DO UPDATE SET vocation = $2, level = $3, guild_id = $5, updated_at = NOW()
       RETURNING *`,
      [name, vocation, level, serverId, guildId || null]
    );
    return mapRowToPlayer(result.rows[0]);
  }

  async updatePlayer(id: string, updates: { vocation?: Vocation; level?: number; guildId?: string | null }): Promise<Player | null> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: (string | number | null)[] = [];
    let paramIndex = 1;

    if (updates.vocation !== undefined) {
      setClauses.push(`vocation = $${paramIndex++}`);
      params.push(updates.vocation);
    }
    if (updates.level !== undefined) {
      setClauses.push(`level = $${paramIndex++}`);
      params.push(updates.level);
    }
    if (updates.guildId !== undefined) {
      setClauses.push(`guild_id = $${paramIndex++}`);
      params.push(updates.guildId);
    }

    params.push(id);
    const result = await this.pool.query(
      `UPDATE players SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    return result.rows.length > 0 ? mapRowToPlayer(result.rows[0]) : null;
  }

  // Player Status operations
  async getPlayerStatus(playerId: string): Promise<PlayerStatus | null> {
    const result = await this.pool.query(
      'SELECT * FROM player_status WHERE player_id = $1',
      [playerId]
    );
    return result.rows.length > 0 ? mapRowToPlayerStatus(result.rows[0]) : null;
  }

  async upsertPlayerStatus(playerId: string, isOnline: boolean, isHunting: boolean = false): Promise<PlayerStatus> {
    const result = await this.pool.query(
      `INSERT INTO player_status (player_id, is_online, is_hunting, last_seen)
       VALUES ($1, $2, $3, CASE WHEN $2 THEN NOW() ELSE NULL END)
       ON CONFLICT (player_id)
       DO UPDATE SET 
         is_online = $2, 
         is_hunting = $3,
         last_seen = CASE WHEN $2 THEN NOW() ELSE player_status.last_seen END
       RETURNING *`,
      [playerId, isOnline, isHunting]
    );
    return mapRowToPlayerStatus(result.rows[0]);
  }

  async getOnlinePlayers(serverId: string): Promise<PlayerWithStatus[]> {
    const result = await this.pool.query(
      `SELECT p.*, ps.id as status_id, ps.is_online, ps.is_hunting, ps.last_seen, ps.created_at as status_created_at,
              g.id as guild_id, g.name as guild_name, g.is_ally,
              s.id as server_id, s.name as server_name, s.type as server_type
       FROM players p
       INNER JOIN player_status ps ON p.id = ps.player_id
       LEFT JOIN guilds g ON p.guild_id = g.id
       INNER JOIN servers s ON p.server_id = s.id
       WHERE p.server_id = $1 AND ps.is_online = true
       ORDER BY p.level DESC, p.name`,
      [serverId]
    );
    
    return result.rows.map((row: Record<string, unknown>) => ({
      ...mapRowToPlayer(row),
      status: {
        id: row.status_id as string,
        playerId: row.id as string,
        isOnline: row.is_online as boolean,
        isHunting: row.is_hunting as boolean,
        lastSeen: row.last_seen ? new Date(row.last_seen as string) : null,
        createdAt: new Date(row.status_created_at as string),
      },
      guild: row.guild_id ? {
        id: row.guild_id as string,
        name: row.guild_name as string,
        serverId: row.server_id as string,
        isAlly: row.is_ally as boolean,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
      } : null,
      server: {
        id: row.server_id as string,
        name: row.server_name as string,
        type: row.server_type as ServerType,
        createdAt: new Date(row.created_at as string),
      },
    }));
  }

  async getHuntingPlayers(serverId: string): Promise<PlayerWithStatus[]> {
    const result = await this.pool.query(
      `SELECT p.*, ps.id as status_id, ps.is_online, ps.is_hunting, ps.last_seen, ps.created_at as status_created_at,
              g.id as guild_id, g.name as guild_name, g.is_ally,
              s.id as server_id, s.name as server_name, s.type as server_type
       FROM players p
       INNER JOIN player_status ps ON p.id = ps.player_id
       LEFT JOIN guilds g ON p.guild_id = g.id
       INNER JOIN servers s ON p.server_id = s.id
       WHERE p.server_id = $1 AND ps.is_hunting = true
       ORDER BY p.level DESC, p.name`,
      [serverId]
    );
    
    return result.rows.map((row: Record<string, unknown>) => ({
      ...mapRowToPlayer(row),
      status: {
        id: row.status_id as string,
        playerId: row.id as string,
        isOnline: row.is_online as boolean,
        isHunting: row.is_hunting as boolean,
        lastSeen: row.last_seen ? new Date(row.last_seen as string) : null,
        createdAt: new Date(row.status_created_at as string),
      },
      guild: row.guild_id ? {
        id: row.guild_id as string,
        name: row.guild_name as string,
        serverId: row.server_id as string,
        isAlly: row.is_ally as boolean,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
      } : null,
      server: {
        id: row.server_id as string,
        name: row.server_name as string,
        type: row.server_type as ServerType,
        createdAt: new Date(row.created_at as string),
      },
    }));
  }

  // XP Snapshot operations
  async createXpSnapshot(playerId: string, level: number, experience: bigint): Promise<XpSnapshot> {
    const result = await this.pool.query(
      'INSERT INTO xp_snapshots (player_id, level, experience, snapshot_time) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [playerId, level, experience.toString()]
    );
    return mapRowToXpSnapshot(result.rows[0]);
  }

  async getLatestXpSnapshot(playerId: string): Promise<XpSnapshot | null> {
    const result = await this.pool.query(
      'SELECT * FROM xp_snapshots WHERE player_id = $1 ORDER BY snapshot_time DESC LIMIT 1',
      [playerId]
    );
    return result.rows.length > 0 ? mapRowToXpSnapshot(result.rows[0]) : null;
  }

  async getXpSnapshots(playerId: string, limit: number = 10): Promise<XpSnapshot[]> {
    const result = await this.pool.query(
      'SELECT * FROM xp_snapshots WHERE player_id = $1 ORDER BY snapshot_time DESC LIMIT $2',
      [playerId, limit]
    );
    return result.rows.map(mapRowToXpSnapshot);
  }

  // Hunting Session operations
  async createHuntingSession(playerId: string): Promise<HuntingSession> {
    const result = await this.pool.query(
      'INSERT INTO hunting_sessions (player_id, start_time) VALUES ($1, NOW()) RETURNING *',
      [playerId]
    );
    return mapRowToHuntingSession(result.rows[0]);
  }

  async getActiveHuntingSession(playerId: string): Promise<HuntingSession | null> {
    const result = await this.pool.query(
      'SELECT * FROM hunting_sessions WHERE player_id = $1 AND is_active = true ORDER BY start_time DESC LIMIT 1',
      [playerId]
    );
    return result.rows.length > 0 ? mapRowToHuntingSession(result.rows[0]) : null;
  }

  async endHuntingSession(sessionId: string, xpGained: bigint): Promise<HuntingSession | null> {
    const result = await this.pool.query(
      'UPDATE hunting_sessions SET end_time = NOW(), xp_gained = $1, is_active = false WHERE id = $2 RETURNING *',
      [xpGained.toString(), sessionId]
    );
    return result.rows.length > 0 ? mapRowToHuntingSession(result.rows[0]) : null;
  }

  async updateHuntingSessionXp(sessionId: string, xpGained: bigint): Promise<HuntingSession | null> {
    const result = await this.pool.query(
      'UPDATE hunting_sessions SET xp_gained = $1 WHERE id = $2 RETURNING *',
      [xpGained.toString(), sessionId]
    );
    return result.rows.length > 0 ? mapRowToHuntingSession(result.rows[0]) : null;
  }

  // Death operations
  async createDeath(
    victimName: string, 
    killerName: string | null, 
    deathTime: Date, 
    serverId: string,
    isAllyDeath: boolean,
    victimId?: string
  ): Promise<Death> {
    const result = await this.pool.query(
      `INSERT INTO deaths (victim_name, killer_name, death_time, server_id, is_ally_death, victim_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [victimName, killerName, deathTime, serverId, isAllyDeath, victimId || null]
    );
    return mapRowToDeath(result.rows[0]);
  }

  async getRecentDeaths(serverId: string, limit: number = 50): Promise<Death[]> {
    const result = await this.pool.query(
      'SELECT * FROM deaths WHERE server_id = $1 ORDER BY death_time DESC LIMIT $2',
      [serverId, limit]
    );
    return result.rows.map(mapRowToDeath);
  }

  async getDeathsByTimeRange(serverId: string, startTime: Date, endTime: Date): Promise<Death[]> {
    const result = await this.pool.query(
      'SELECT * FROM deaths WHERE server_id = $1 AND death_time BETWEEN $2 AND $3 ORDER BY death_time DESC',
      [serverId, startTime, endTime]
    );
    return result.rows.map(mapRowToDeath);
  }

  // Playtime Pattern operations
  async upsertPlaytimePattern(playerId: string, hourOfDay: number, dayOfWeek: number): Promise<PlaytimePattern> {
    const result = await this.pool.query(
      `INSERT INTO playtime_patterns (player_id, hour_of_day, day_of_week, frequency)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (player_id, hour_of_day, day_of_week)
       DO UPDATE SET frequency = playtime_patterns.frequency + 1, last_updated = NOW()
       RETURNING *`,
      [playerId, hourOfDay, dayOfWeek]
    );
    return mapRowToPlaytimePattern(result.rows[0]);
  }

  async getPlaytimePatterns(playerId: string): Promise<PlaytimePattern[]> {
    const result = await this.pool.query(
      'SELECT * FROM playtime_patterns WHERE player_id = $1 ORDER BY frequency DESC',
      [playerId]
    );
    return result.rows.map(mapRowToPlaytimePattern);
  }

  // User operations
  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
  }

  async createUser(username: string, passwordHash: string): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, passwordHash]
    );
    return mapRowToUser(result.rows[0]);
  }

  async approveUser(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'UPDATE users SET is_approved = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
  }

  async getPendingUsers(): Promise<User[]> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE is_approved = false ORDER BY created_at'
    );
    return result.rows.map(mapRowToUser);
  }

  // Discord Config operations
  async getDiscordConfigs(discordGuildId?: string): Promise<DiscordConfig[]> {
    let query = 'SELECT * FROM discord_config WHERE is_enabled = true';
    const params: string[] = [];
    
    if (discordGuildId) {
      query += ' AND discord_guild_id = $1';
      params.push(discordGuildId);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows.map(mapRowToDiscordConfig);
  }

  async createDiscordConfig(
    discordGuildId: string, 
    channelId: string, 
    notificationType: NotificationType
  ): Promise<DiscordConfig> {
    const result = await this.pool.query(
      `INSERT INTO discord_config (discord_guild_id, channel_id, notification_type) 
       VALUES ($1, $2, $3) RETURNING *`,
      [discordGuildId, channelId, notificationType]
    );
    return mapRowToDiscordConfig(result.rows[0]);
  }

  async updateDiscordConfig(id: string, isEnabled: boolean): Promise<DiscordConfig | null> {
    const result = await this.pool.query(
      'UPDATE discord_config SET is_enabled = $1 WHERE id = $2 RETURNING *',
      [isEnabled, id]
    );
    return result.rows.length > 0 ? mapRowToDiscordConfig(result.rows[0]) : null;
  }

  async deleteDiscordConfig(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM discord_config WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Scraper Log operations
  async createScraperLog(
    scraperType: string, 
    status: ScraperStatus, 
    message?: string, 
    executionTime?: number
  ): Promise<ScraperLog> {
    const result = await this.pool.query(
      'INSERT INTO scraper_logs (scraper_type, status, message, execution_time) VALUES ($1, $2, $3, $4) RETURNING *',
      [scraperType, status, message || null, executionTime || null]
    );
    return mapRowToScraperLog(result.rows[0]);
  }

  async getScraperLogs(scraperType?: string, limit: number = 100): Promise<ScraperLog[]> {
    let query = 'SELECT * FROM scraper_logs';
    const params: (string | number)[] = [];
    
    if (scraperType) {
      query += ' WHERE scraper_type = $1';
      params.push(scraperType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await this.pool.query(query, params);
    return result.rows.map(mapRowToScraperLog);
  }

  // Guild Member Snapshot operations
  async createGuildMemberSnapshot(guildId: string, playerName: string, vocation: string): Promise<GuildMemberSnapshot> {
    const result = await this.pool.query(
      'INSERT INTO guild_member_snapshots (guild_id, player_name, vocation, snapshot_time) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [guildId, playerName, vocation]
    );
    return mapRowToGuildMemberSnapshot(result.rows[0]);
  }

  async getLatestGuildMemberSnapshots(guildId: string): Promise<GuildMemberSnapshot[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT ON (player_name) * 
       FROM guild_member_snapshots 
       WHERE guild_id = $1 
       ORDER BY player_name, snapshot_time DESC`,
      [guildId]
    );
    return result.rows.map(mapRowToGuildMemberSnapshot);
  }
}

// Singleton instance
let repositoryInstance: Repository | null = null;

export function getRepository(): Repository {
  if (!repositoryInstance) {
    repositoryInstance = new Repository();
  }
  return repositoryInstance;
}
