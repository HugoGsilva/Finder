import { getRepository } from '../database';
import { Guild, Player, CreateGuildDto, UpdateGuildDto } from '../types';
import { logger } from '../utils/logger';

export class GuildService {
  async getAllGuilds(serverId?: string): Promise<Guild[]> {
    const repository = getRepository();
    return repository.getAllGuilds(serverId);
  }

  async getGuildById(id: string): Promise<Guild | null> {
    const repository = getRepository();
    return repository.getGuildById(id);
  }

  async getGuildByNameAndServer(name: string, serverId: string): Promise<Guild | null> {
    const repository = getRepository();
    return repository.getGuildByNameAndServer(name, serverId);
  }

  async createGuild(dto: CreateGuildDto): Promise<Guild> {
    const repository = getRepository();

    // Validate server exists
    const server = await repository.getServerById(dto.serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    // Check if guild already exists for this server
    const existingGuild = await repository.getGuildByNameAndServer(dto.name, dto.serverId);
    if (existingGuild) {
      throw new Error('Guild already exists for this server');
    }

    const guild = await repository.createGuild(dto.name, dto.serverId, dto.isAlly);
    logger.info(`Guild created: ${guild.name} (${dto.isAlly ? 'Ally' : 'Enemy'}) on server ${server.name}`);
    
    return guild;
  }

  async updateGuild(id: string, dto: UpdateGuildDto): Promise<Guild> {
    const repository = getRepository();

    const existingGuild = await repository.getGuildById(id);
    if (!existingGuild) {
      throw new Error('Guild not found');
    }

    const updatedGuild = await repository.updateGuild(id, dto);
    if (!updatedGuild) {
      throw new Error('Failed to update guild');
    }

    logger.info(`Guild updated: ${updatedGuild.name}`);
    return updatedGuild;
  }

  async deleteGuild(id: string): Promise<void> {
    const repository = getRepository();

    const existingGuild = await repository.getGuildById(id);
    if (!existingGuild) {
      throw new Error('Guild not found');
    }

    const deleted = await repository.deleteGuild(id);
    if (!deleted) {
      throw new Error('Failed to delete guild');
    }

    logger.info(`Guild deleted: ${existingGuild.name}`);
  }

  async getGuildMembers(guildId: string): Promise<Player[]> {
    const repository = getRepository();

    const guild = await repository.getGuildById(guildId);
    if (!guild) {
      throw new Error('Guild not found');
    }

    return repository.getPlayersByGuild(guildId);
  }

  async getAllyGuilds(serverId: string): Promise<Guild[]> {
    const repository = getRepository();

    const server = await repository.getServerById(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    return repository.getAllyGuilds(serverId);
  }

  async getEnemyGuilds(serverId: string): Promise<Guild[]> {
    const repository = getRepository();

    const server = await repository.getServerById(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    return repository.getEnemyGuilds(serverId);
  }
}

// Singleton instance
let guildServiceInstance: GuildService | null = null;

export function getGuildService(): GuildService {
  if (!guildServiceInstance) {
    guildServiceInstance = new GuildService();
  }
  return guildServiceInstance;
}
