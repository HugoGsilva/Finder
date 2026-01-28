import { create } from 'zustand';
import type { Server, Guild, Player, Death, HuntingSession } from '../types';
import { api } from '../lib/api';
import { socketClient } from '../lib/socket';

interface DataState {
  // Server selection
  selectedServerId: string | null;
  servers: Server[];
  
  // Data
  guilds: Guild[];
  onlinePlayers: Player[];
  huntingSessions: HuntingSession[];
  deaths: Death[];
  
  // Loading states
  isLoadingServers: boolean;
  isLoadingGuilds: boolean;
  isLoadingPlayers: boolean;
  isLoadingDeaths: boolean;
  
  // Actions
  loadServers: () => Promise<void>;
  selectServer: (serverId: string) => void;
  loadGuilds: (serverId: string) => Promise<void>;
  loadOnlinePlayers: (serverId: string) => Promise<void>;
  loadHuntingSessions: (serverId: string) => Promise<void>;
  loadDeaths: (serverId: string, limit?: number) => Promise<void>;
  
  // WebSocket handlers
  handlePlayerStatus: (data: any) => void;
  handleNewDeath: (data: Death) => void;
  handleHuntingUpdate: (data: HuntingSession) => void;
  handleMemberUpdate: (data: { guild_id: string; server_id: string }) => void;
  
  // Utilities
  reset: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  selectedServerId: null,
  servers: [],
  guilds: [],
  onlinePlayers: [],
  huntingSessions: [],
  deaths: [],
  isLoadingServers: false,
  isLoadingGuilds: false,
  isLoadingPlayers: false,
  isLoadingDeaths: false,

  loadServers: async () => {
    set({ isLoadingServers: true });
    try {
      const servers = await api.getServers();
      set({ servers, isLoadingServers: false });
    } catch (error) {
      console.error('Failed to load servers:', error);
      set({ isLoadingServers: false });
    }
  },

  selectServer: (serverId: string) => {
    const currentServerId = get().selectedServerId;
    
    // Unsubscribe from previous server
    if (currentServerId) {
      socketClient.unsubscribeFromServer(currentServerId);
    }
    
    // Subscribe to new server
    socketClient.subscribeToServer(serverId);
    
    set({ selectedServerId: serverId });
    
    // Load data for selected server
    get().loadGuilds(serverId);
    get().loadOnlinePlayers(serverId);
    get().loadHuntingSessions(serverId);
    get().loadDeaths(serverId);
  },

  loadGuilds: async (serverId: string) => {
    set({ isLoadingGuilds: true });
    try {
      const guilds = await api.getGuilds(serverId);
      set({ guilds, isLoadingGuilds: false });
    } catch (error) {
      console.error('Failed to load guilds:', error);
      set({ isLoadingGuilds: false });
    }
  },

  loadOnlinePlayers: async (serverId: string) => {
    set({ isLoadingPlayers: true });
    try {
      const onlinePlayers = await api.getOnlinePlayers(serverId);
      set({ onlinePlayers, isLoadingPlayers: false });
    } catch (error) {
      console.error('Failed to load online players:', error);
      set({ isLoadingPlayers: false });
    }
  },

  loadHuntingSessions: async (serverId: string) => {
    try {
      const huntingSessions = await api.getHuntingPlayers(serverId);
      set({ huntingSessions });
    } catch (error) {
      console.error('Failed to load hunting sessions:', error);
    }
  },

  loadDeaths: async (serverId: string, limit = 50) => {
    set({ isLoadingDeaths: true });
    try {
      const deaths = await api.getDeaths(serverId, limit);
      set({ deaths, isLoadingDeaths: false });
    } catch (error) {
      console.error('Failed to load deaths:', error);
      set({ isLoadingDeaths: false });
    }
  },

  handlePlayerStatus: (data: any) => {
    const { onlinePlayers } = get();
    
    if (data.is_online) {
      // Player came online - add if not already in list
      const exists = onlinePlayers.some(p => p.id === data.player_id);
      if (!exists) {
        // Reload to get full player data
        const { selectedServerId, loadOnlinePlayers } = get();
        if (selectedServerId) {
          loadOnlinePlayers(selectedServerId);
        }
      }
    } else {
      // Player went offline - remove from list
      set({
        onlinePlayers: onlinePlayers.filter(p => p.id !== data.player_id),
      });
    }
  },

  handleNewDeath: (data: Death) => {
    const { deaths, selectedServerId } = get();
    
    // Only add if death is for selected server
    if (data.server_id === selectedServerId) {
      // Add to beginning of list and limit to 50
      set({
        deaths: [data, ...deaths].slice(0, 50),
      });
    }
  },

  handleHuntingUpdate: (data: HuntingSession) => {
    const { huntingSessions } = get();
    
    // Update existing session or add new one
    const index = huntingSessions.findIndex(s => s.id === data.id);
    if (index >= 0) {
      const updated = [...huntingSessions];
      updated[index] = data;
      set({ huntingSessions: updated });
    } else {
      set({ huntingSessions: [data, ...huntingSessions] });
    }
  },

  handleMemberUpdate: (data: { guild_id: string; server_id: string }) => {
    const { selectedServerId, loadGuilds } = get();
    
    // Reload guilds if update is for selected server
    if (data.server_id === selectedServerId) {
      loadGuilds(selectedServerId);
    }
  },

  reset: () => {
    const { selectedServerId } = get();
    
    // Unsubscribe from WebSocket
    if (selectedServerId) {
      socketClient.unsubscribeFromServer(selectedServerId);
    }
    
    set({
      selectedServerId: null,
      guilds: [],
      onlinePlayers: [],
      huntingSessions: [],
      deaths: [],
    });
  },
}));
