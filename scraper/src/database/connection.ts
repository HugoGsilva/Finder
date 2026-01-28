import { Pool, PoolConfig } from 'pg';
import { logger } from '../utils/logger';

// PostgreSQL connection pool
let pool: Pool | null = null;

export function getPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      max: 10,
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
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    
    pool.on('error', (err: Error) => {
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
