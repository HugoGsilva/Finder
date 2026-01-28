import axios, { AxiosError, AxiosInstance } from 'axios';
import type { AuthResponse, LoginCredentials, RegisterData, Server, Guild, Player, Death, HuntingSession, User, DiscordConfig, ApiError } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/api/auth/login', credentials);
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async register(registerData: RegisterData): Promise<{ message: string }> {
    const { data } = await this.client.post('/api/auth/register', registerData);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get<User>('/api/auth/me');
    return data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  }

  // Server endpoints
  async getServers(): Promise<Server[]> {
    const { data } = await this.client.get<Server[]>('/api/servers');
    return data;
  }

  async getServer(serverId: string): Promise<Server> {
    const { data } = await this.client.get<Server>(`/api/servers/${serverId}`);
    return data;
  }

  async updateServer(serverId: string, updates: Partial<Server>): Promise<Server> {
    const { data } = await this.client.put<Server>(`/api/servers/${serverId}`, updates);
    return data;
  }

  // Guild endpoints
  async getGuilds(serverId: string): Promise<Guild[]> {
    const { data } = await this.client.get<Guild[]>(`/api/guilds/${serverId}`);
    return data;
  }

  async getGuild(guildId: string): Promise<Guild> {
    const { data } = await this.client.get<Guild>(`/api/guilds/guild/${guildId}`);
    return data;
  }

  async createGuild(guildData: Omit<Guild, 'id' | 'last_checked' | 'member_count'>): Promise<Guild> {
    const { data } = await this.client.post<Guild>('/api/guilds', guildData);
    return data;
  }

  async updateGuild(guildId: string, updates: Partial<Guild>): Promise<Guild> {
    const { data } = await this.client.put<Guild>(`/api/guilds/${guildId}`, updates);
    return data;
  }

  async deleteGuild(guildId: string): Promise<void> {
    await this.client.delete(`/api/guilds/${guildId}`);
  }

  // Player endpoints
  async getOnlinePlayers(serverId: string): Promise<Player[]> {
    const { data } = await this.client.get<Player[]>(`/api/players/${serverId}/online`);
    return data;
  }

  async getHuntingPlayers(serverId: string): Promise<HuntingSession[]> {
    const { data } = await this.client.get<HuntingSession[]>(`/api/players/${serverId}/hunting`);
    return data;
  }

  async getPlayer(name: string, serverId: string): Promise<Player> {
    const { data } = await this.client.get<Player>(`/api/players/${name}/${serverId}`);
    return data;
  }

  // Death endpoints
  async getDeaths(serverId: string, limit: number = 50): Promise<Death[]> {
    const { data } = await this.client.get<Death[]>(`/api/deaths/${serverId}`, {
      params: { limit },
    });
    return data;
  }

  // Admin endpoints
  async getUsers(): Promise<User[]> {
    const { data } = await this.client.get<User[]>('/api/auth/users');
    return data;
  }

  async approveUser(userId: string): Promise<User> {
    const { data } = await this.client.post<User>(`/api/auth/approve/${userId}`);
    return data;
  }

  async getDiscordConfigs(serverId: string): Promise<DiscordConfig[]> {
    const { data } = await this.client.get<DiscordConfig[]>(`/api/guilds/${serverId}/discord`);
    return data;
  }

  async createDiscordConfig(config: Omit<DiscordConfig, 'id' | 'created_at'>): Promise<DiscordConfig> {
    const { data } = await this.client.post<DiscordConfig>('/api/guilds/discord', config);
    return data;
  }

  async updateDiscordConfig(configId: string, updates: Partial<DiscordConfig>): Promise<DiscordConfig> {
    const { data } = await this.client.put<DiscordConfig>(`/api/guilds/discord/${configId}`, updates);
    return data;
  }
}

export const api = new ApiClient();
