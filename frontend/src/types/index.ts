export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
}

export interface Server {
  id: string;
  name: string;
  type: 'OpenPVP' | 'RetroPVP';
  url: string;
  is_active: boolean;
}

export interface Guild {
  id: string;
  server_id: string;
  name: string;
  classification: 'ally' | 'enemy' | 'neutral';
  is_active: boolean;
  last_checked: string;
  member_count: number;
}

export interface Player {
  id: string;
  name: string;
  server_id: string;
  guild_id: string | null;
  guild_name?: string;
  guild_classification?: 'ally' | 'enemy' | 'neutral';
  level: number;
  vocation: string;
  total_xp: string;
  is_online: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface PlayerStatus {
  player_id: string;
  player_name: string;
  server_id: string;
  is_online: boolean;
  timestamp: string;
}

export interface HuntingSession {
  id: string;
  player_id: string;
  player_name: string;
  server_id: string;
  guild_name?: string;
  guild_classification?: 'ally' | 'enemy' | 'neutral';
  level: number;
  vocation: string;
  start_time: string;
  end_time: string | null;
  start_xp: string;
  end_xp: string | null;
  xp_gained: string | null;
  duration_minutes: number | null;
  avg_xp_per_hour: string | null;
}

export interface Death {
  id: string;
  player_id: string;
  player_name: string;
  player_guild?: string;
  player_guild_classification?: 'ally' | 'enemy' | 'neutral';
  server_id: string;
  level: number;
  killers: string[];
  killer_guilds: string[];
  killer_classifications: string[];
  death_time: string;
  created_at: string;
}

export interface PlaytimePattern {
  player_id: string;
  player_name: string;
  server_id: string;
  hour_of_day: number;
  day_of_week: number;
  average_duration_minutes: number;
  frequency_count: number;
  last_updated: string;
}

export interface DiscordConfig {
  id: string;
  server_id: string;
  guild_id: string | null;
  channel_id: string;
  notify_deaths: boolean;
  notify_hunting: boolean;
  notify_status: boolean;
  notify_members: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  errors?: Array<{ field: string; message: string }>;
}
