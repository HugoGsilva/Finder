# Guild Monitoring System - Design Document

## Overview

O Guild Monitoring System é uma aplicação web full-stack que monitora atividades de guildas em servidores do Rubinot através de web scraping automatizado. O sistema coleta dados de múltiplas fontes, processa informações em tempo real, e apresenta em uma interface web responsiva com atualizações automáticas. Inclui integração com Discord para notificações e um painel administrativo completo.

**Stack Tecnológica:**
- **Frontend**: React com TypeScript, TailwindCSS para estilização temática
- **Backend**: Node.js com Express e TypeScript
- **Database**: PostgreSQL para dados estruturados
- **Scraping**: Cheerio para parsing HTML + Axios para requisições HTTP
- **Real-time**: WebSockets (Socket.io) para atualizações em tempo real
- **Discord Integration**: Discord.js para bot de notificações
- **Task Scheduling**: node-cron para agendamento de tarefas
- **Authentication**: JWT para autenticação de usuários

## Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React UI]
        WS_CLIENT[WebSocket Client]
    end

    subgraph "Backend Layer"
        API[Express API]
        AUTH[Auth Service]
        WS_SERVER[WebSocket Server]
        SCHEDULER[Task Scheduler]
    end

    subgraph "Scraping Layer"
        GUILD_SCRAPER[Guild Scraper]
        KILLBOARD_SCRAPER[Killboard Scraper]
        ONLINE_SCRAPER[Online Players Scraper]
        HIGHSCORE_SCRAPER[Highscore Scraper]
        PLAYTIME_SCRAPER[Playtime Scraper]
        HTTP_CLIENT[Axios HTTP Client]
        HTML_PARSER[Cheerio Parser]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        CACHE[Redis Cache]
    end

    subgraph "Integration Layer"
        DISCORD_BOT[Discord Bot]
    end

    UI --> API
    UI --> WS_CLIENT
    WS_CLIENT --> WS_SERVER
    API --> AUTH
    API --> DB
    SCHEDULER --> GUILD_SCRAPER
    SCHEDULER --> KILLBOARD_SCRAPER
    SCHEDULER --> ONLINE_SCRAPER
    SCHEDULER --> HIGHSCORE_SCRAPER
    SCHEDULER --> PLAYTIME_SCRAPER
    GUILD_SCRAPER --> HTTP_CLIENT
    KILLBOARD_SCRAPER --> HTTP_CLIENT
    ONLINE_SCRAPER --> HTTP_CLIENT
    HIGHSCORE_SCRAPER --> HTTP_CLIENT
    PLAYTIME_SCRAPER --> HTTP_CLIENT
    HTTP_CLIENT --> HTML_PARSER
    HTML_PARSER --> DB
    GUILD_SCRAPER --> DB
    KILLBOARD_SCRAPER --> DB
    ONLINE_SCRAPER --> DB
    HIGHSCORE_SCRAPER --> DB
    PLAYTIME_SCRAPER --> DB
    DB --> WS_SERVER
    DB --> DISCORD_BOT
    CACHE --> API
```

**Arquitetura em Camadas:**

1. **Frontend Layer**: Interface React com atualizações em tempo real via WebSockets
2. **Backend Layer**: API REST para operações CRUD e WebSocket server para push de dados
3. **Scraping Layer**: Conjunto de scrapers especializados que utilizam Axios para disparar requisições HTTP (POST/GET) com payloads application/x-www-form-urlencoded simulando submissões de formulários do Rubinot, e Cheerio para extração de dados via seletores CSS
4. **Data Layer**: PostgreSQL para persistência e Redis para cache de dados frequentes
5. **Integration Layer**: Discord Bot para notificações externas

## Components and Interfaces

### Frontend Components

#### 1. Dashboard Component
```typescript
interface DashboardProps {
  selectedServer: Server;
  onServerChange: (server: Server) => void;
}

interface DashboardState {
  players: PlayerStatus[];
  recentDeaths: Death[];
  huntingPlayers: HuntingPlayer[];
  lastUpdate: Date;
}
```

#### 2. Player Card Component
```typescript
interface PlayerCardProps {
  player: PlayerStatus;
  showDetails: boolean;
}

interface PlayerStatus {
  name: string;
  vocation: Vocation;
  level: number;
  isOnline: boolean;
  isHunting: boolean;
  guild: string;
  isAlly: boolean;
  huntingStats?: HuntingStats;
  playTimePattern?: PlayTimePattern;
}
```

#### 3. Admin Panel Component
```typescript
interface AdminPanelProps {
  user: AdminUser;
}

interface GuildManagementProps {
  guilds: Guild[];
  onAddGuild: (guild: Guild) => Promise<void>;
  onRemoveGuild: (guildId: string) => Promise<void>;
  onUpdateGuild: (guild: Guild) => Promise<void>;
}
```

### Backend Services

#### 1. Scraper Service Interface
```typescript
interface IScraperService {
  scrape(): Promise<ScrapedData>;
  getLastRun(): Date;
  getNextRun(): Date;
  getStatus(): ScraperStatus;
}

interface ScraperConfig {
  interval: number; // milliseconds
  retryAttempts: number;
  timeout: number;
  enabled: boolean;
  headers: Record<string, string>; // User-Agent, Accept, etc.
  cookieJar?: CookieJar; // For session persistence
}

interface FormPayload {
  [key: string]: string | number;
}

interface ScraperHttpClient {
  get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse>;
  post(url: string, payload: FormPayload, config?: AxiosRequestConfig): Promise<AxiosResponse>;
  getCookies(): string[];
  setCookies(cookies: string[]): void;
}
```

#### 2. Guild Service
```typescript
interface IGuildService {
  addGuild(guild: CreateGuildDto): Promise<Guild>;
  removeGuild(guildId: string): Promise<void>;
  updateGuild(guildId: string, updates: UpdateGuildDto): Promise<Guild>;
  getGuilds(serverId?: string): Promise<Guild[]>;
  getGuildMembers(guildId: string): Promise<GuildMember[]>;
}
```

#### 3. Player Service
```typescript
interface IPlayerService {
  getPlayerStatus(playerName: string): Promise<PlayerStatus>;
  updatePlayerStatus(playerName: string, status: Partial<PlayerStatus>): Promise<void>;
  getOnlinePlayers(serverId: string): Promise<PlayerStatus[]>;
  getHuntingPlayers(serverId: string): Promise<HuntingPlayer[]>;
  calculateXpGain(playerName: string, currentXp: bigint): Promise<XpGainResult>;
}
```

#### 4. Discord Service
```typescript
interface IDiscordService {
  sendNotification(channelId: string, notification: Notification): Promise<void>;
  configureChannels(config: DiscordChannelConfig): Promise<void>;
  getConnectionStatus(): DiscordStatus;
}

interface Notification {
  type: NotificationType;
  title: string;
  description: string;
  fields: NotificationField[];
  timestamp: Date;
  color: string;
}
```

## Data Models

### Database Schema

```sql
-- Servers
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL, -- 'OpenPVP' or 'RetroPVP'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Guilds
CREATE TABLE guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  server_id UUID REFERENCES servers(id),
  is_ally BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, server_id)
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  vocation VARCHAR(20) NOT NULL,
  level INTEGER NOT NULL,
  guild_id UUID REFERENCES guilds(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Player Status
CREATE TABLE player_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  is_online BOOLEAN NOT NULL,
  is_hunting BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- XP Tracking
CREATE TABLE xp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  level INTEGER NOT NULL,
  experience BIGINT NOT NULL,
  snapshot_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hunting Sessions
CREATE TABLE hunting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  xp_gained BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deaths (Killboard)
CREATE TABLE deaths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  victim_id UUID REFERENCES players(id),
  killer_name VARCHAR(100),
  death_time TIMESTAMP NOT NULL,
  server_id UUID REFERENCES servers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Play Time Patterns
CREATE TABLE playtime_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  hour_of_day INTEGER NOT NULL, -- 0-23
  day_of_week INTEGER NOT NULL, -- 0-6
  frequency INTEGER NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discord Configuration
CREATE TABLE discord_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id VARCHAR(100) NOT NULL,
  channel_id VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scraper Logs
CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  execution_time INTEGER, -- milliseconds
  created_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Models

```typescript
enum Vocation {
  KNIGHT = 'Knight',
  SORCERER = 'Sorcerer',
  DRUID = 'Druid',
  PALADIN = 'Paladin',
  NONE = 'None'
}

enum ServerType {
  OPEN_PVP = 'OpenPVP',
  RETRO_PVP = 'RetroPVP'
}

interface Server {
  id: string;
  name: string;
  type: ServerType;
  createdAt: Date;
}

interface Guild {
  id: string;
  name: string;
  serverId: string;
  isAlly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Player {
  id: string;
  name: string;
  vocation: Vocation;
  level: number;
  guildId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface XpSnapshot {
  id: string;
  playerId: string;
  level: number;
  experience: bigint;
  snapshotTime: Date;
}

interface HuntingSession {
  id: string;
  playerId: string;
  startTime: Date;
  endTime?: Date;
  xpGained: bigint;
  isActive: boolean;
}

interface HuntingStats {
  sessionDuration: number; // minutes
  xpGained: bigint;
  xpPerMinute: number;
  startTime: Date;
}

interface Death {
  id: string;
  victimId: string;
  killerName: string;
  deathTime: Date;
  serverId: string;
}

interface PlayTimePattern {
  primaryHours: number[]; // Array of hours (0-23)
  primaryDays: number[]; // Array of days (0-6)
  totalSessions: number;
}

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: Date;
}

interface DiscordChannelConfig {
  guildId: string;
  channelId: string;
  notificationType: NotificationType;
  isEnabled: boolean;
}

enum NotificationType {
  KILLBOARD = 'killboard',
  ONLINE_STATUS = 'online_status',
  HUNTING_ACTIVITY = 'hunting_activity',
  MEMBER_UPDATES = 'member_updates'
}
```

##
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Scheduling properties (1.4, 2.4, 3.4, 4.6, 5.4) share the same timing mechanism and can be tested together
- Navigation properties (1.1, 2.1, 4.1) follow the same pattern and can be unified
- Data completeness properties (2.3, 3.5, 5.5, 8.5) verify similar concerns about required fields
- Status determination properties (3.2, 4.4) both deal with state transitions based on data changes

### Core Properties

**Property 1: Player name parsing excludes titles**
*For any* player name string containing text in parentheses, the parser should extract only the portion before the parentheses, excluding the title.
**Validates: Requirements 1.2**

**Property 2: Guild data persistence includes timestamp**
*For any* guild member data collected, the stored record should contain a valid timestamp indicating when the collection occurred.
**Validates: Requirements 1.3**

**Property 3: Scheduler triggers at configured intervals**
*For any* scheduled task with a configured interval, the task should execute when the specified time has elapsed since the last execution.
**Validates: Requirements 1.4, 2.4, 3.4, 4.6, 5.4**

**Property 4: Guild classification matches configuration**
*For any* guild in the system configuration, the system should correctly identify it as either ally or enemy based on the stored classification.
**Validates: Requirements 2.2, 2.5**

**Property 5: Death records contain complete information**
*For any* death event detected, the stored record should contain non-null values for victim, killer, timestamp, and server.
**Validates: Requirements 2.3**

**Property 6: Online status reflects presence in list**
*For any* player, if their name appears in the online players list, they should be marked as online; otherwise, they should be marked as offline.
**Validates: Requirements 3.2**

**Property 7: Status changes trigger immediate updates**
*For any* player whose online status changes, the database record should reflect the new status within the same transaction.
**Validates: Requirements 3.3**

**Property 8: Online player data is complete**
*For any* player in the online list, the extracted data should include non-empty values for name, level, and vocation.
**Validates: Requirements 3.5**

**Property 9: XP gain calculation is accurate**
*For any* two XP snapshots of the same player, the calculated XP gain should equal the difference between the later and earlier experience values.
**Validates: Requirements 4.3**

**Property 10: XP increase triggers hunting status**
*For any* player whose XP increases between snapshots, the system should mark them as hunting and calculate their XP per minute rate.
**Validates: Requirements 4.4**

**Property 11: Hunting session displays duration and total XP**
*For any* active hunting session, the displayed information should include both the elapsed time in minutes and the total XP gained since session start.
**Validates: Requirements 4.7**

**Property 12: Playtime pattern identification**
*For any* player with playtime history data, the system should identify and store the hours and days with highest activity frequency.
**Validates: Requirements 5.2**

**Property 13: Playtime data persistence**
*For any* player whose playtime has been analyzed, the system should store the identified patterns in the database.
**Validates: Requirements 5.3**

**Property 14: Playtime display completeness**
*For any* player with stored playtime patterns, the display should show both primary hours and activity statistics.
**Validates: Requirements 5.5**

**Property 15: Guild configuration requires classification**
*For any* guild being added to the system, the ally/enemy classification field should be required and stored.
**Validates: Requirements 6.2**

**Property 16: Guild configuration requires server**
*For any* guild being added to the system, a valid server association should be required.
**Validates: Requirements 6.3**

**Property 17: Guild configuration is database-driven**
*For any* guild configuration, the data should be stored in the database, not hardcoded in the application.
**Validates: Requirements 6.4**

**Property 18: Scrapers process only configured guilds**
*For any* scraping operation, only guilds that exist in the database configuration should be processed.
**Validates: Requirements 6.5**

**Property 19: New user registration defaults to unapproved**
*For any* new user registration, the initial approval status should be false.
**Validates: Requirements 7.2**

**Property 20: Admin panel filters unapproved users**
*For any* query to list pending users, only users with approval status false should be returned.
**Validates: Requirements 7.3**

**Property 21: User approval enables access**
*For any* user whose approval status changes from false to true, subsequent authentication attempts should succeed.
**Validates: Requirements 7.4**

**Property 22: Unapproved users are denied access**
*For any* user with approval status false, authentication attempts should be rejected.
**Validates: Requirements 7.5**

**Property 23: Discord notification routing**
*For any* configured notification type and event, the notification should be sent to the channel configured for that notification type.
**Validates: Requirements 8.3**

**Property 24: Discord notification completeness**
*For any* Discord notification sent, the message should include relevant event data and a timestamp.
**Validates: Requirements 8.5**

**Property 25: Frontend auto-refresh interval**
*For any* user viewing the dashboard, the frontend should request updated data at 5-second intervals.
**Validates: Requirements 10.1**

**Property 26: Updates without page reload**
*For any* data update in the frontend, the update should occur via asynchronous request without triggering a full page reload.
**Validates: Requirements 10.2**

**Property 27: Updated elements receive visual indicator**
*For any* data element that changes value, the element should receive a visual indicator (CSS class or animation) to highlight the change.
**Validates: Requirements 10.4**

**Property 28: Updates don't interrupt user interaction**
*For any* user interaction in progress, incoming data updates should not cancel or interfere with the interaction.
**Validates: Requirements 10.5**

**Property 29: Server-specific data filtering**
*For any* server selection by the user, only data associated with that server should be displayed.
**Validates: Requirements 11.4**

**Property 30: Server-specific scraping isolation**
*For any* scraping operation on one server, it should not affect or be affected by scraping operations on other servers.
**Validates: Requirements 11.3**

**Property 31: Server type determines navigation strategy**
*For any* server being scraped, the navigation logic should adapt based on whether the server type is OpenPVP or RetroPVP.
**Validates: Requirements 11.5**

**Property 32: Network failure triggers retry**
*For any* network request that fails, an error should be logged and a retry should be scheduled after the configured interval.
**Validates: Requirements 12.1**

**Property 33: Parsing failure triggers alert**
*For any* scraping operation where expected HTML elements are not found, an alert should be logged for manual review.
**Validates: Requirements 12.2**

**Property 34: Invalid data is skipped**
*For any* data record that fails validation, the record should be skipped and processing should continue with the next record.
**Validates: Requirements 12.3**

**Property 35: Timeout triggers abort and retry**
*For any* request that exceeds the configured timeout, the request should be aborted and a retry should be scheduled.
**Validates: Requirements 12.4**

**Property 36: Error logging includes diagnostic information**
*For any* error that occurs, the log entry should include error message, stack trace, timestamp, and relevant context.
**Validates: Requirements 12.5**

## Error Handling

### Scraping Errors

1. **Network Failures**: Implement exponential backoff retry strategy with maximum 3 attempts
2. **Parsing Errors**: Log detailed error with HTML snapshot for debugging
3. **Timeout Handling**: Abort request after 30 seconds and schedule retry
4. **Rate Limiting**: Implement delays between requests to avoid being blocked

### Database Errors

1. **Connection Failures**: Use connection pooling with automatic reconnection
2. **Constraint Violations**: Log and skip duplicate records
3. **Transaction Failures**: Rollback and retry with exponential backoff

### Discord Bot Errors

1. **Connection Loss**: Implement automatic reconnection with exponential backoff
2. **Rate Limiting**: Queue messages and respect Discord rate limits
3. **Invalid Channel**: Log error and disable notifications for that channel

### Frontend Errors

1. **WebSocket Disconnection**: Automatically attempt reconnection
2. **API Failures**: Display user-friendly error messages and retry
3. **Authentication Failures**: Redirect to login page

## Testing Strategy

### Unit Testing

**Framework**: Jest for both frontend and backend

**Unit Test Coverage**:
- Service layer methods (Guild Service, Player Service, Discord Service)
- Data parsing functions (player name extraction, XP calculation)
- Authentication and authorization logic
- API endpoint handlers
- React component rendering

**Example Unit Tests**:
- Test that player name "John Doe (The Brave)" extracts as "John Doe"
- Test that XP calculation with values 1000000000000 and 1000000050000 returns 50000
- Test that unapproved user authentication returns 403 status
- Test that PlayerCard component renders with correct props

### Property-Based Testing

**Framework**: fast-check for TypeScript

**Configuration**: Each property test should run minimum 100 iterations

**Property Test Coverage**:
- Player name parsing with various formats and edge cases
- XP calculations with large numbers (>12 digits)
- Guild classification logic with random configurations
- Status determination with various online/offline scenarios
- Scheduling logic with different time intervals
- Data validation with random valid and invalid inputs

**Test Tagging**: Each property-based test must include a comment with format:
```typescript
// Feature: guild-monitoring-system, Property X: [property description]
```

### Integration Testing

**Framework**: Supertest for API testing, Playwright for E2E

**Integration Test Coverage**:
- Complete scraping workflows from page navigation to data storage
- WebSocket communication between frontend and backend
- Discord bot message sending and channel configuration
- User registration, approval, and authentication flow
- Admin panel CRUD operations for guilds

### Edge Cases

- Empty player lists
- Players with special characters in names
- XP values exceeding JavaScript Number.MAX_SAFE_INTEGER (use BigInt)
- Concurrent scraping operations
- Network timeouts and retries
- Invalid HTML structure in scraped pages

## Implementation Notes

### Web Scraping Best Practices

1. **HTTP Client**: Use Axios with proper headers (User-Agent, Accept-Encoding) and socket timeout configuration
2. **Compression**: Enable Gzip/Brotli compression to minimize network traffic
3. **HTML Parsing**: Use Cheerio for efficient DOM traversal and data extraction via CSS selectors
4. **Form Payloads**: Inspect and replicate exact form field names (including hidden inputs) for POST requests
5. **Cookie Management**: Implement Cookie Jar for session persistence between requests
6. **Request Delays**: Add random delays between requests (1-3 seconds) to avoid rate limiting
7. **Error Recovery**: Implement robust error handling and retry logic with exponential backoff
8. **CSRF Tokens**: Extract and include any CSRF tokens from initial GET requests in subsequent POST requests

### Performance Considerations

1. **Database Indexing**: Create indexes on frequently queried fields (player name, guild_id, server_id)
2. **Caching**: Use Redis to cache frequently accessed data (online players, recent deaths)
3. **Connection Pooling**: Configure PostgreSQL connection pool for optimal performance
4. **Batch Operations**: Use batch inserts for bulk data operations
5. **WebSocket Optimization**: Only send delta updates, not full dataset

### Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds of 12
2. **JWT Tokens**: Set reasonable expiration (24 hours) and use secure signing key
3. **Input Validation**: Validate and sanitize all user inputs
4. **SQL Injection Prevention**: Use parameterized queries exclusively
5. **Rate Limiting**: Implement rate limiting on API endpoints
6. **CORS Configuration**: Configure CORS to allow only trusted origins

### Scalability Considerations

1. **Horizontal Scaling**: Design scrapers to run on multiple instances with distributed locking
2. **Database Sharding**: Consider sharding by server_id if data grows large
3. **Message Queue**: Use Redis or RabbitMQ for task distribution if needed
4. **CDN**: Serve static assets through CDN
5. **Load Balancing**: Use load balancer for multiple backend instances

## Deployment Architecture

### Docker Architecture

```mermaid
graph TB
    subgraph "Docker Compose Environment"
        NGINX[Nginx Container]
        FRONTEND[Frontend Container]
        BACKEND1[Backend Container 1]
        BACKEND2[Backend Container 2]
        SCRAPER[Scraper Container]
        DISCORD[Discord Bot Container]
        DB[(PostgreSQL Container)]
        REDIS[(Redis Container)]
    end

    NGINX --> FRONTEND
    NGINX --> BACKEND1
    NGINX --> BACKEND2
    BACKEND1 --> DB
    BACKEND2 --> DB
    BACKEND1 --> REDIS
    BACKEND2 --> REDIS
    SCRAPER --> DB
    DISCORD --> DB
    DISCORD --> REDIS
```

### Container Structure

**1. Frontend Container**
- Base Image: `node:18-alpine`
- Build Stage: Multi-stage build with production optimization
- Serves: Static React build files via Nginx
- Port: 3000 (internal)

**2. Backend API Container**
- Base Image: `node:18-alpine`
- Services: Express API, WebSocket server
- Port: 4000 (internal)
- Scalable: Can run multiple instances

**3. Scraper Container**
- Base Image: `node:18-alpine`
- Services: All scraping services with cron scheduling
- Dependencies: Cheerio and Axios for lightweight scraping
- Restart Policy: Always restart on failure

**4. Discord Bot Container**
- Base Image: `node:18-alpine`
- Services: Discord.js bot
- Restart Policy: Always restart on failure

**5. PostgreSQL Container**
- Base Image: `postgres:15-alpine`
- Volume: Persistent data storage
- Port: 5432 (internal only)

**6. Redis Container**
- Base Image: `redis:7-alpine`
- Volume: Optional persistence
- Port: 6379 (internal only)

**7. Nginx Container**
- Base Image: `nginx:alpine`
- Services: Reverse proxy and load balancer
- Port: 80 (external), 443 (external with SSL)

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: guild-monitor-db
    environment:
      POSTGRES_DB: guild_monitor
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - guild-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: guild-monitor-redis
    volumes:
      - redis_data:/data
    networks:
      - guild-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: guild-monitor-backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/guild_monitor
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 4000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - guild-network
    restart: unless-stopped
    deploy:
      replicas: 1

  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
    container_name: guild-monitor-scraper
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/guild_monitor
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - guild-network
    restart: unless-stopped

  discord-bot:
    build:
      context: ./discord-bot
      dockerfile: Dockerfile
    container_name: guild-monitor-discord
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/guild_monitor
      REDIS_URL: redis://redis:6379
      DISCORD_TOKEN: ${DISCORD_TOKEN}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - guild-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: ${API_URL}
        REACT_APP_WS_URL: ${WS_URL}
    container_name: guild-monitor-frontend
    networks:
      - guild-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: guild-monitor-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    networks:
      - guild-network
    restart: unless-stopped

networks:
  guild-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile Examples

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

**Scraper Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Environment Configuration

**.env file structure:**
```env
# Database
DB_USER=guild_monitor_user
DB_PASSWORD=secure_password_here
DB_NAME=guild_monitor

# Redis
REDIS_PASSWORD=redis_password_here

# Backend
JWT_SECRET=your_jwt_secret_here
PORT=4000

# Discord
DISCORD_TOKEN=your_discord_bot_token_here

# Frontend URLs
API_URL=http://localhost/api
WS_URL=ws://localhost/ws
```

### Deployment Strategy

**Development Environment:**
```bash
docker-compose up --build
```

**Production Environment:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Scaling Backend:**
```bash
docker-compose up -d --scale backend=3
```

**Health Checks:**
- PostgreSQL: `pg_isready` command
- Redis: `redis-cli ping`
- Backend: HTTP endpoint `/health`
- Frontend: Nginx status

**Backup Strategy:**
- Database: Automated daily backups using `pg_dump` in cron job
- Volumes: Regular snapshots of Docker volumes
- Configuration: Version controlled in Git

**Monitoring:**
- Container logs: `docker-compose logs -f [service]`
- Resource usage: `docker stats`
- Health status: `docker-compose ps`

### Production Optimizations

1. **Multi-stage Builds**: Reduce image size by separating build and runtime
2. **Layer Caching**: Optimize Dockerfile layer order for faster builds
3. **Alpine Images**: Use Alpine Linux for smaller image sizes
4. **Health Checks**: Implement health checks for all services
5. **Resource Limits**: Set memory and CPU limits in docker-compose
6. **Secrets Management**: Use Docker secrets or external secret management
7. **Logging**: Configure centralized logging with log drivers
8. **Network Isolation**: Use internal networks for service communication

## Technology Justification

**React + TypeScript**: Type safety and component reusability for complex UI
**Node.js + Express**: JavaScript ecosystem consistency, excellent async handling
**PostgreSQL**: ACID compliance, complex queries, JSON support
**Cheerio + Axios**: Lightweight and efficient HTML parsing without browser overhead
**Socket.io**: Reliable WebSocket implementation with fallbacks
**Discord.js**: Official Discord API library with excellent documentation
**fast-check**: Mature property-based testing library for TypeScript
**TailwindCSS**: Rapid UI development with utility classes
