# Quick Reference - Guild Monitoring System

## 🚀 Quick Start Commands

### First Time Setup
```bash
# Clone and setup
cd Finder

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp scraper/.env.example scraper/.env
cp discord-bot/.env.example discord-bot/.env

# Edit .env files with your configuration
# Then start everything
docker-compose up -d
```

### Daily Development

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f scraper
docker-compose logs -f discord-bot
docker-compose logs -f frontend

# Rebuild specific service
docker-compose up -d --build backend

# Restart specific service
docker-compose restart backend
```

## 🔧 Development Commands

### Backend
```bash
cd backend

# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build
npm run build

# Production mode
npm start

# Type check
npm run typecheck

# Lint
npm run lint
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development mode (Vite dev server)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test
```

### Scraper
```bash
cd scraper

# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Production mode
npm start
```

### Discord Bot
```bash
cd discord-bot

# Install dependencies
npm install

# Development mode
npm run dev

# Build
npm run build

# Production mode
npm start
```

## 🗄️ Database Commands

### PostgreSQL
```bash
# Connect to database
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor

# Backup database
docker exec guild-monitor-postgres pg_dump -U guild_monitor_user guild_monitor > backup.sql

# Restore database
cat backup.sql | docker exec -i guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor

# View table sizes
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Count records in tables
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor -c "
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"
```

### Useful SQL Queries
```sql
-- View all servers
SELECT id, name, type, is_active FROM servers;

-- View all guilds by server
SELECT s.name as server, g.name as guild, g.classification, g.member_count
FROM guilds g
JOIN servers s ON g.server_id = s.id
WHERE g.is_active = true
ORDER BY s.name, g.classification, g.name;

-- View online players
SELECT p.name, p.level, p.vocation, s.name as server, g.name as guild
FROM players p
JOIN servers s ON p.server_id = s.id
LEFT JOIN guilds g ON p.guild_id = g.id
WHERE p.is_online = true
ORDER BY s.name, p.level DESC;

-- View active hunting sessions
SELECT 
  p.name,
  p.level,
  s.name as server,
  hs.xp_gained,
  hs.avg_xp_per_hour,
  hs.duration_minutes
FROM hunting_sessions hs
JOIN players p ON hs.player_id = p.id
JOIN servers s ON hs.server_id = s.id
WHERE hs.end_time IS NULL
ORDER BY hs.avg_xp_per_hour DESC;

-- View recent deaths
SELECT 
  d.player_name,
  d.level,
  s.name as server,
  d.killers,
  d.death_time
FROM deaths d
JOIN servers s ON d.server_id = s.id
ORDER BY d.death_time DESC
LIMIT 20;

-- View scraper logs
SELECT 
  scraper_type,
  status,
  message,
  created_at
FROM scraper_logs
ORDER BY created_at DESC
LIMIT 50;

-- View Discord configurations
SELECT 
  s.name as server,
  g.name as guild,
  dc.channel_id,
  dc.notify_deaths,
  dc.notify_hunting,
  dc.notify_status,
  dc.is_active
FROM discord_config dc
JOIN servers s ON dc.server_id = s.id
LEFT JOIN guilds g ON dc.guild_id = g.id
WHERE dc.is_active = true;
```

### Redis
```bash
# Connect to Redis
docker exec -it guild-monitor-redis redis-cli

# View all keys
KEYS *

# Get value
GET key_name

# Delete key
DEL key_name

# Clear all data
FLUSHALL

# View memory usage
INFO memory
```

## 🐛 Debugging Commands

### Check Service Health
```bash
# Check if all containers are running
docker-compose ps

# Check backend health endpoint
curl http://localhost:3000/health

# Check if WebSocket is accessible
curl -I http://localhost:3000/ws

# Check frontend
curl http://localhost
```

### View Real-time Logs
```bash
# All services with timestamps
docker-compose logs -f --timestamps

# Only errors
docker-compose logs -f | grep -i error

# Specific service with tail
docker-compose logs -f --tail=100 backend
```

### Container Shell Access
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Scraper
docker-compose exec scraper sh

# Discord Bot
docker-compose exec discord-bot sh

# PostgreSQL
docker-compose exec postgres bash

# Redis
docker-compose exec redis sh
```

### Performance Monitoring
```bash
# View resource usage
docker stats

# View specific container
docker stats guild-monitor-backend

# View disk usage
docker system df

# View detailed disk usage
docker system df -v
```

## 🧹 Cleanup Commands

### Remove Containers
```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers and volumes
docker-compose down -v

# Stop, remove containers, volumes and images
docker-compose down -v --rmi all
```

### Clean Docker System
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Remove everything including volumes
docker system prune -a --volumes
```

### Clean Database
```sql
-- Remove old deaths (keep last 30 days)
DELETE FROM deaths WHERE death_time < NOW() - INTERVAL '30 days';

-- Remove old XP snapshots (keep last 60 days)
DELETE FROM xp_snapshots WHERE snapshot_time < NOW() - INTERVAL '60 days';

-- Remove old scraper logs (keep last 7 days)
DELETE FROM scraper_logs WHERE created_at < NOW() - INTERVAL '7 days';

-- Remove old player status (keep last 24 hours)
DELETE FROM player_status WHERE timestamp < NOW() - INTERVAL '24 hours';

-- Vacuum database
VACUUM ANALYZE;
```

## 🔄 Update Commands

### Pull Latest Changes
```bash
# Pull from git
git pull origin main

# Rebuild all services
docker-compose build

# Restart with new images
docker-compose up -d
```

### Update Dependencies
```bash
# Update backend
cd backend && npm update && cd ..

# Update frontend
cd frontend && npm update && cd ..

# Update scraper
cd scraper && npm update && cd ..

# Update discord bot
cd discord-bot && npm update && cd ..

# Rebuild
docker-compose build
docker-compose up -d
```

## 📦 Export/Import

### Export Configuration
```bash
# Export guilds configuration
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor -c "COPY guilds TO STDOUT CSV HEADER" > guilds_export.csv

# Export discord config
docker exec -it guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor -c "COPY discord_config TO STDOUT CSV HEADER" > discord_export.csv
```

### Import Configuration
```bash
# Import guilds
cat guilds_export.csv | docker exec -i guild-monitor-postgres psql -U guild_monitor_user -d guild_monitor -c "COPY guilds FROM STDIN CSV HEADER"
```

## 🔐 Security Commands

### Change Admin Password
```sql
-- Connect to database
-- Then run:
UPDATE users 
SET password = '$2b$12$NEW_HASHED_PASSWORD_HERE'
WHERE username = 'pifot16';
```

To generate new hash:
```bash
# In Node.js REPL
node
> const bcrypt = require('bcrypt');
> bcrypt.hashSync('newpassword', 12);
```

### Regenerate JWT Secret
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update backend/.env
JWT_SECRET=<new_secret_here>

# Restart backend
docker-compose restart backend
```

## 📊 Monitoring Queries

### Active Users
```sql
SELECT 
  username,
  email,
  is_admin,
  created_at,
  last_login
FROM users
WHERE is_approved = true
ORDER BY last_login DESC;
```

### Scraper Performance
```sql
SELECT 
  scraper_type,
  COUNT(*) as runs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successes,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
  ROUND(AVG(EXTRACT(EPOCH FROM (created_at - created_at))), 2) as avg_duration
FROM scraper_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY scraper_type
ORDER BY scraper_type;
```

### Player Activity
```sql
SELECT 
  s.name as server,
  COUNT(DISTINCT p.id) as total_players,
  COUNT(DISTINCT CASE WHEN p.is_online THEN p.id END) as online_now,
  COUNT(DISTINCT CASE WHEN p.last_seen > NOW() - INTERVAL '24 hours' THEN p.id END) as active_24h
FROM servers s
LEFT JOIN players p ON p.server_id = s.id
WHERE s.is_active = true
GROUP BY s.id, s.name
ORDER BY s.name;
```

## 🎯 Testing Commands

### API Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"pifot16","password":"Kx3nvqt1"}'

# Test authenticated endpoint (replace TOKEN)
curl http://localhost:3000/api/servers \
  -H "Authorization: Bearer TOKEN"
```

### Load Testing
```bash
# Install hey if needed
# go install github.com/rakyll/hey@latest

# Test backend endpoint
hey -n 1000 -c 10 http://localhost:3000/health
```

## 📱 Discord Bot Commands

### Check Bot Status
```bash
# View logs
docker-compose logs -f discord-bot

# Check if bot is online in Discord
# Look for "Discord bot is ready" in logs

# Restart bot
docker-compose restart discord-bot
```

### Test Notification
```sql
-- Send a test by inserting a death
INSERT INTO deaths (
  player_id,
  player_name,
  server_id,
  level,
  killers,
  killer_guilds,
  death_time
) SELECT 
  id,
  name,
  server_id,
  level,
  ARRAY['Test Killer'],
  ARRAY['Test Guild'],
  NOW()
FROM players
WHERE name = 'SomePlayerName'
LIMIT 1;
```

---

## 📞 Support

For issues:
1. Check logs: `docker-compose logs -f <service>`
2. Check this reference guide
3. Check DEPLOYMENT.md for detailed troubleshooting
4. Open GitHub issue with logs

## 🎉 Happy Monitoring!
