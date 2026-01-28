import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger';
import { checkDatabaseHealth, gracefulShutdown } from './database';

// Import routes
import authRoutes from './routes/auth.routes';
import serverRoutes from './routes/server.routes';
import guildRoutes from './routes/guild.routes';
import playerRoutes from './routes/player.routes';
import deathRoutes from './routes/death.routes';

// Import WebSocket setup
import { setupWebSocket } from './websocket';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (required for rate limiting behind reverse proxy like Traefik/Nginx)
app.set('trust proxy', 1);

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: Function) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = await checkDatabaseHealth();
    const status = health.postgres && health.redis ? 'healthy' : 'unhealthy';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      services: health,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/deaths', deathRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Setup WebSocket
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  path: '/ws',
});

setupWebSocket(io);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
  logger.info(`WebSocket server available at /ws`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await gracefulShutdown();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await gracefulShutdown();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, io };
