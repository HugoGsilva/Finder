// Vocation types
export enum Vocation {
  KNIGHT = 'Knight',
  SORCERER = 'Sorcerer',
  DRUID = 'Druid',
  PALADIN = 'Paladin',
  ELITE_KNIGHT = 'Elite Knight',
  MASTER_SORCERER = 'Master Sorcerer',
  ELDER_DRUID = 'Elder Druid',
  ROYAL_PALADIN = 'Royal Paladin',
  NONE = 'None'
}

// Server types
export enum ServerType {
  OPEN_PVP = 'OpenPVP',
  RETRO_PVP = 'RetroPVP'
}

// Notification types for Discord
export enum NotificationType {
  KILLBOARD = 'killboard',
  ONLINE_STATUS = 'online_status',
  HUNTING_ACTIVITY = 'hunting_activity',
  MEMBER_UPDATES = 'member_updates'
}

// Scraper status types
export enum ScraperStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning'
}

// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
}

// Server model
export interface Server extends BaseEntity {
  name: string;
  type: ServerType;
}

// Guild model
export interface Guild extends BaseEntity {
  name: string;
  serverId: string;
  isAlly: boolean;
  updatedAt: Date;
}

// Player model
export interface Player extends BaseEntity {
  name: string;
  vocation: Vocation;
  level: number;
  guildId: string | null;
  serverId: string;
  updatedAt: Date;
}

// Player status model
export interface PlayerStatus extends BaseEntity {
  playerId: string;
  isOnline: boolean;
  isHunting: boolean;
  lastSeen: Date | null;
}

// Full player with status (for API responses)
export interface PlayerWithStatus extends Player {
  status: PlayerStatus | null;
  guild: Guild | null;
  server: Server | null;
}

// XP Snapshot model
export interface XpSnapshot extends BaseEntity {
  playerId: string;
  level: number;
  experience: bigint;
  snapshotTime: Date;
}

// Hunting session model
export interface HuntingSession extends BaseEntity {
  playerId: string;
  startTime: Date;
  endTime: Date | null;
  xpGained: bigint;
  isActive: boolean;
}

// Hunting stats (calculated)
export interface HuntingStats {
  sessionDuration: number; // minutes
  xpGained: bigint;
  xpPerMinute: number;
  startTime: Date;
}

// Death model (killboard)
export interface Death extends BaseEntity {
  victimName: string;
  victimId: string | null;
  killerName: string | null;
  deathTime: Date;
  serverId: string;
  isAllyDeath: boolean;
}

// Playtime pattern model
export interface PlaytimePattern {
  id: string;
  playerId: string;
  hourOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  frequency: number;
  lastUpdated: Date;
}

// Aggregated playtime data
export interface PlaytimeAnalysis {
  primaryHours: number[];
  primaryDays: number[];
  totalSessions: number;
  averageSessionLength: number;
}

// User model
export interface User extends BaseEntity {
  username: string;
  passwordHash: string;
  isAdmin: boolean;
  isApproved: boolean;
}

// User without password (for API responses)
export interface UserPublic {
  id: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: Date;
}

// Discord configuration model
export interface DiscordConfig extends BaseEntity {
  discordGuildId: string;
  channelId: string;
  notificationType: NotificationType;
  isEnabled: boolean;
}

// Scraper log model
export interface ScraperLog extends BaseEntity {
  scraperType: string;
  status: ScraperStatus;
  message: string | null;
  executionTime: number | null; // milliseconds
}

// Guild member snapshot model
export interface GuildMemberSnapshot extends BaseEntity {
  guildId: string;
  playerName: string;
  vocation: string;
  snapshotTime: Date;
}

// DTOs for creating entities
export interface CreateGuildDto {
  name: string;
  serverId: string;
  isAlly: boolean;
}

export interface UpdateGuildDto {
  name?: string;
  isAlly?: boolean;
}

export interface CreatePlayerDto {
  name: string;
  vocation: Vocation;
  level: number;
  guildId?: string;
  serverId: string;
}

export interface UpdatePlayerDto {
  vocation?: Vocation;
  level?: number;
  guildId?: string | null;
}

export interface CreateUserDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface CreateDiscordConfigDto {
  discordGuildId: string;
  channelId: string;
  notificationType: NotificationType;
  isEnabled?: boolean;
}

// Scraped data types
export interface ScrapedGuildMember {
  name: string;
  vocation: Vocation;
}

export interface ScrapedOnlinePlayer {
  name: string;
  level: number;
  vocation: Vocation;
}

export interface ScrapedDeath {
  victimName: string;
  killerName: string | null;
  deathTime: Date;
}

export interface ScrapedHighscoreEntry {
  rank: number;
  name: string;
  level: number;
  experience: bigint;
}

// Scraper configuration
export interface ScraperConfig {
  interval: number;
  retryAttempts: number;
  timeout: number;
  enabled: boolean;
  userAgent: string;
}
