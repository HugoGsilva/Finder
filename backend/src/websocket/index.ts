import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthPayload } from '../types';
import { getRedisClient } from '../database';

interface AuthenticatedSocket extends Socket {
  user?: AuthPayload;
}

export function setupWebSocket(io: SocketIOServer): void {
  // Authentication middleware for WebSocket
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
      const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
      
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`WebSocket client connected: ${socket.id} (user: ${socket.user?.username})`);

    // Join server-specific rooms
    socket.on('subscribe:server', (serverId: string) => {
      socket.join(`server:${serverId}`);
      logger.debug(`Client ${socket.id} subscribed to server ${serverId}`);
    });

    socket.on('unsubscribe:server', (serverId: string) => {
      socket.leave(`server:${serverId}`);
      logger.debug(`Client ${socket.id} unsubscribed from server ${serverId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error from client ${socket.id}:`, error);
    });
  });

  logger.info('WebSocket server configured');
}

// Helper functions to emit events

export async function emitPlayerStatusUpdate(
  io: SocketIOServer,
  serverId: string,
  update: {
    playerId: string;
    playerName: string;
    isOnline: boolean;
    isHunting: boolean;
  }
): Promise<void> {
  io.to(`server:${serverId}`).emit('player:status', update);
  logger.debug(`Emitted player status update for ${update.playerName}`);
}

export async function emitDeathEvent(
  io: SocketIOServer,
  serverId: string,
  death: {
    deathId: string;
    victimName: string;
    killerName: string | null;
    deathTime: Date;
    isAllyDeath: boolean;
  }
): Promise<void> {
  io.to(`server:${serverId}`).emit('death:new', death);
  logger.debug(`Emitted death event for ${death.victimName}`);
}

export async function emitHuntingUpdate(
  io: SocketIOServer,
  serverId: string,
  update: {
    playerId: string;
    playerName: string;
    xpGained: string;
    xpPerMinute: number;
    sessionDuration: number;
  }
): Promise<void> {
  io.to(`server:${serverId}`).emit('hunting:update', update);
  logger.debug(`Emitted hunting update for ${update.playerName}`);
}

export async function emitMemberUpdate(
  io: SocketIOServer,
  serverId: string,
  update: {
    guildName: string;
    memberName: string;
    action: 'joined' | 'left';
  }
): Promise<void> {
  io.to(`server:${serverId}`).emit('member:update', update);
  logger.debug(`Emitted member update: ${update.memberName} ${update.action} ${update.guildName}`);
}

// Periodic data refresh broadcaster
export function startPeriodicBroadcast(io: SocketIOServer): void {
  // Property 25: Frontend auto-refresh interval (5 seconds)
  setInterval(async () => {
    try {
      // Ensure Redis is available
      await getRedisClient();
      
      // Broadcast a ping to all connected clients
      io.emit('ping', { timestamp: new Date() });
      
      // Clients can request fresh data based on this ping
    } catch (error) {
      logger.error('Periodic broadcast failed:', error);
    }
  }, 5000); // 5 seconds
}
