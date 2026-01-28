import { Pool, PoolConfig } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

// PostgreSQL connection pool
let pool: Pool | null = null;

export function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'guild_monitor',
    user: process.env.DB_USER || 'guild_monitor_user',
    password: process.env.DB_PASSWORD || 'secure_password_here',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    pool.on('connect', () => {
      logger.debug('New client connected to PostgreSQL');
    });
  }
  
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
}

// Redis client
let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
  }
  
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

// Health check for database connections
export async function checkDatabaseHealth(): Promise<{ postgres: boolean; redis: boolean }> {
  const health = { postgres: false, redis: false };

  try {
    const pgPool = getPool();
    const result = await pgPool.query('SELECT 1');
    health.postgres = result.rows.length > 0;
  } catch (error) {
    logger.error('PostgreSQL health check failed', error);
  }

  try {
    const redis = await getRedisClient();
    const pong = await redis.ping();
    health.redis = pong === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', error);
  }

  return health;
}

// Graceful shutdown
export async function gracefulShutdown(): Promise<void> {
  logger.info('Initiating graceful shutdown...');
  await closePool();
  await closeRedis();
  logger.info('All connections closed');
}
