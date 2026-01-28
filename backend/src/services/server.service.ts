import { getRepository } from '../database';
import { Server } from '../types';

export class ServerService {
  async getAllServers(): Promise<Server[]> {
    const repository = getRepository();
    return repository.getAllServers();
  }

  async getServerById(id: string): Promise<Server | null> {
    const repository = getRepository();
    return repository.getServerById(id);
  }

  async getServerByName(name: string): Promise<Server | null> {
    const repository = getRepository();
    return repository.getServerByName(name);
  }
}

// Singleton instance
let serverServiceInstance: ServerService | null = null;

export function getServerService(): ServerService {
  if (!serverServiceInstance) {
    serverServiceInstance = new ServerService();
  }
  return serverServiceInstance;
}
