import { io, Socket } from 'socket.io-client';
import type { PlayerStatus, Death, HuntingSession } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export interface SocketEvents {
  'player:status': (data: PlayerStatus) => void;
  'death:new': (data: Death) => void;
  'hunting:update': (data: HuntingSession) => void;
  'member:update': (data: { guild_id: string; server_id: string }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      path: '/ws',
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  subscribeToServer(serverId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot subscribe');
      return;
    }
    this.socket.emit('subscribe', `server:${serverId}`);
  }

  unsubscribeFromServer(serverId: string): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit('unsubscribe', `server:${serverId}`);
  }

  on<K extends keyof SocketEvents>(event: K, handler: SocketEvents[K]): void {
    if (!this.socket) {
      console.warn('Socket not initialized');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket.on(event as string, handler as any);
  }

  off<K extends keyof SocketEvents>(event: K, handler?: SocketEvents[K]): void {
    if (!this.socket) {
      return;
    }
    if (handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.off(event as string, handler as any);
    } else {
      this.socket.off(event as string);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
