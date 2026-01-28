-- Guild Monitoring System - Database Schema
-- PostgreSQL 15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Servers
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('OpenPVP', 'RetroPVP')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guilds
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  is_ally BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, server_id)
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  vocation VARCHAR(20) NOT NULL CHECK (vocation IN ('Knight', 'Sorcerer', 'Druid', 'Paladin', 'None', 'Elite Knight', 'Master Sorcerer', 'Elder Druid', 'Royal Paladin')),
  level INTEGER NOT NULL DEFAULT 1,
  guild_id UUID REFERENCES guilds(id) ON DELETE SET NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, server_id)
);

-- Player Status
CREATE TABLE player_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  is_hunting BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- XP Tracking
CREATE TABLE xp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  experience BIGINT NOT NULL,
  snapshot_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hunting Sessions
CREATE TABLE hunting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  xp_gained BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deaths (Killboard)
CREATE TABLE deaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  victim_name VARCHAR(100) NOT NULL,
  victim_id UUID REFERENCES players(id) ON DELETE SET NULL,
  killer_name VARCHAR(100),
  death_time TIMESTAMP NOT NULL,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  is_ally_death BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Play Time Patterns
CREATE TABLE playtime_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  frequency INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, hour_of_day, day_of_week)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discord Configuration
CREATE TABLE discord_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id VARCHAR(100) NOT NULL,
  channel_id VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('killboard', 'online_status', 'hunting_activity', 'member_updates')),
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(discord_guild_id, channel_id, notification_type)
);

-- Scraper Logs
CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guild Member Snapshots (for tracking member changes)
CREATE TABLE guild_member_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,
  vocation VARCHAR(20) NOT NULL,
  snapshot_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_players_guild_id ON players(guild_id);
CREATE INDEX idx_players_server_id ON players(server_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_player_status_player_id ON player_status(player_id);
CREATE INDEX idx_player_status_is_online ON player_status(is_online);
CREATE INDEX idx_xp_snapshots_player_id ON xp_snapshots(player_id);
CREATE INDEX idx_xp_snapshots_snapshot_time ON xp_snapshots(snapshot_time);
CREATE INDEX idx_hunting_sessions_player_id ON hunting_sessions(player_id);
CREATE INDEX idx_hunting_sessions_is_active ON hunting_sessions(is_active);
CREATE INDEX idx_deaths_server_id ON deaths(server_id);
CREATE INDEX idx_deaths_death_time ON deaths(death_time);
CREATE INDEX idx_deaths_victim_id ON deaths(victim_id);
CREATE INDEX idx_playtime_patterns_player_id ON playtime_patterns(player_id);
CREATE INDEX idx_scraper_logs_scraper_type ON scraper_logs(scraper_type);
CREATE INDEX idx_scraper_logs_created_at ON scraper_logs(created_at);
CREATE INDEX idx_guild_member_snapshots_guild_id ON guild_member_snapshots(guild_id);
CREATE INDEX idx_guilds_server_id ON guilds(server_id);

-- Seed initial servers
INSERT INTO servers (name, type) VALUES
  ('Auroria', 'OpenPVP'),
  ('Belaria', 'OpenPVP'),
  ('Vesperia', 'OpenPVP'),
  ('Bellum', 'RetroPVP'),
  ('Spectrum', 'RetroPVP'),
  ('Tenebrium', 'RetroPVP');

-- Create initial admin user (pifot16 with password Kx3nvqt1)
-- Password hash generated with bcrypt, 12 salt rounds
INSERT INTO users (username, password_hash, is_admin, is_approved) VALUES
  ('pifot16', '$2b$12$z6dOXB9VS3JVlpq3nbnr5..eggui19nOTPsCQIKfsWrMso0iSTZcq', TRUE, TRUE);
