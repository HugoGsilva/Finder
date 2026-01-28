# Implementation Plan

- [x] 1. Setup project structure and Docker environment
  - Create monorepo structure with frontend, backend, scraper, and discord-bot directories
  - Create Docker configuration files (Dockerfiles, docker-compose.yml, .env.example)
  - Setup TypeScript configuration for all services
  - Initialize package.json for each service with required dependencies
  - Create database initialization SQL script with schema
  - _Requirements: All_

- [x] 2. Implement database layer and models
- [x] 2.1 Create database schema and migrations
  - Implement SQL schema for all tables (servers, guilds, players, xp_snapshots, hunting_sessions, deaths, playtime_patterns, users, discord_config, scraper_logs)
  - Create database indexes for performance optimization
  - Setup database connection pooling configuration
  - _Requirements: 1.3, 2.3, 3.3, 4.3, 5.3, 6.4, 7.2, 8.2, 12.5_

- [x] 2.2 Create TypeScript models and interfaces
  - Implement TypeScript interfaces for all data models (Server, Guild, Player, XpSnapshot, HuntingSession, Death, PlayTimePattern, User, DiscordChannelConfig)
  - Create enums for Vocation, ServerType, NotificationType
  - _Requirements: 1.2, 2.2, 3.2, 4.4, 5.2, 6.2, 7.2, 8.2_

- [ ] 2.3 Write property test for guild configuration
  - **Property 17: Guild configuration is database-driven**
  - **Validates: Requirements 6.4**

- [x] 3. Implement authentication and user management
- [x] 3.1 Create user service with registration and authentication
  - Implement user registration endpoint with bcrypt password hashing
  - Create JWT-based authentication system
  - Implement login endpoint with token generation
  - Create middleware for JWT validation
  - _Requirements: 7.1, 7.2_

- [x] 3.2 Implement user approval system
  - Create admin endpoint to list pending users
  - Implement user approval/rejection functionality
  - Add authorization middleware to check approval status
  - Create initial admin user seeding (pifot16)
  - _Requirements: 7.3, 7.4, 7.5, 7.6_

- [ ] 3.3 Write property tests for user authentication
  - **Property 19: New user registration defaults to unapproved**
  - **Validates: Requirements 7.2**

- [ ] 3.4 Write property test for user approval
  - **Property 21: User approval enables access**
  - **Validates: Requirements 7.4**

- [ ] 3.5 Write property test for access control
  - **Property 22: Unapproved users are denied access**
  - **Validates: Requirements 7.5**

- [x] 4. Implement guild management service
- [x] 4.1 Create guild CRUD operations
  - Implement addGuild endpoint with validation
  - Create updateGuild endpoint
  - Implement removeGuild endpoint
  - Create getGuilds endpoint with optional server filtering
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 4.2 Implement guild member tracking
  - Create getGuildMembers endpoint
  - Implement logic to associate players with guilds
  - _Requirements: 1.2, 6.5_

- [ ] 4.3 Write property test for guild classification
  - **Property 4: Guild classification matches configuration**
  - **Validates: Requirements 2.2, 2.5**

- [ ] 4.4 Write property test for guild configuration requirements
  - **Property 15: Guild configuration requires classification**
  - **Property 16: Guild configuration requires server**
  - **Validates: Requirements 6.2, 6.3**

- [x] 5. Implement scraper base infrastructure
- [x] 5.1 Create base scraper service with Cheerio and Axios
  - Setup Axios HTTP client with proper headers (User-Agent, Accept-Encoding) and socket timeout configuration
  - Enable Gzip/Brotli compression for requests
  - Configure Cheerio for HTML parsing
  - Implement Cookie Jar for session persistence between requests
  - Create base scraper class with error handling and retry logic
  - Implement timeout handling and exponential backoff
  - _Requirements: 1.5, 12.1, 12.4_

- [ ] 5.1.1 Map Rubinot form payloads
  - Inspect all form fields (visible and hidden inputs) on Rubinot pages
  - Document exact field names and expected values for each form
  - Create payload builders for guilds, killboard, highscores, and worlds pages
  - Extract and handle any CSRF tokens if present
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 5.1.2 Implement cookie persistence strategy
  - Create cookie management system to persist Set-Cookie headers
  - Implement logic to include cookies in subsequent requests
  - Test cookie persistence across multi-step form submissions
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 5.2 Implement scraper logging system
  - Create scraper log service to record execution status
  - Implement detailed error logging with context
  - _Requirements: 12.2, 12.5_

- [ ] 5.3 Write property tests for error handling
  - **Property 32: Network failure triggers retry**
  - **Property 35: Timeout triggers abort and retry**
  - **Property 36: Error logging includes diagnostic information**
  - **Validates: Requirements 12.1, 12.4, 12.5**

- [ ] 6. Implement guild members scraper
- [ ] 6.1 Create guild scraper with form submission
  - Perform initial GET request to obtain any tokens or session data
  - Implement POST request to ?subtopic=guilds with server selection payload
  - Parse HTML response with Cheerio to locate guild links
  - Submit second request to view specific guild
  - Parse player table rows with Cheerio selectors
  - Extract player names excluding titles in parentheses using regex
  - Extract vocation for each member from table cells
  - _Requirements: 1.1, 1.2_

- [ ] 6.2 Implement guild data persistence
  - Store guild member data with timestamps
  - Update player records in database
  - _Requirements: 1.3_

- [ ] 6.3 Write property test for player name parsing
  - **Property 1: Player name parsing excludes titles**
  - **Validates: Requirements 1.2**

- [ ] 6.4 Write property test for data persistence
  - **Property 2: Guild data persistence includes timestamp**
  - **Validates: Requirements 1.3**

- [ ] 7. Implement online players scraper
- [ ] 7.1 Create online players scraper
  - Implement GET request with server parameter in URL
  - Parse HTML response with Cheerio
  - Extract player name, level, and vocation from table rows
  - _Requirements: 3.1, 3.5_

- [ ] 7.2 Implement online status tracking
  - Compare online list with configured guild members
  - Update player online/offline status in database
  - Trigger immediate status updates
  - _Requirements: 3.2, 3.3_

- [ ] 7.3 Write property test for online status
  - **Property 6: Online status reflects presence in list**
  - **Validates: Requirements 3.2**

- [ ] 7.4 Write property test for status updates
  - **Property 7: Status changes trigger immediate updates**
  - **Validates: Requirements 3.3**

- [ ] 7.5 Write property test for data completeness
  - **Property 8: Online player data is complete**
  - **Validates: Requirements 3.5**

- [ ] 8. Implement killboard scraper
- [ ] 8.1 Create killboard scraper with form filtering
  - Perform initial GET request to ?subtopic=latestdeaths
  - Implement first POST request with server selection payload
  - Parse response to extract guild filter options
  - Submit second POST request with guild filter payload
  - Parse HTML response with Cheerio to extract death table
  - Extract death events with victim, killer, and timestamp from table rows
  - Distinguish between ally and enemy deaths based on guild configuration
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 8.2 Implement death event persistence
  - Store death records with complete information
  - _Requirements: 2.3_

- [ ] 8.3 Write property test for death records
  - **Property 5: Death records contain complete information**
  - **Validates: Requirements 2.3**

- [ ] 9. Implement highscores scraper and hunting detection
- [ ] 9.1 Create highscores scraper with pagination
  - Perform initial GET request to ?subtopic=highscores
  - Implement POST request with server selection payload
  - Parse HTML response with Cheerio to extract highscores table
  - Implement pagination logic to follow "next page" links for minimum 15 pages
  - Extract player name, level, and XP points from table rows using Cheerio selectors
  - Handle large XP values (>12 digits) using BigInt conversion
  - _Requirements: 4.1, 4.2, 4.5_

- [ ] 9.2 Implement XP tracking and hunting detection
  - Create XP snapshot storage
  - Implement XP gain calculation between snapshots
  - Detect hunting activity based on XP increase
  - Calculate XP per minute rate
  - Track hunting session duration and total XP
  - _Requirements: 4.3, 4.4, 4.7_

- [ ] 9.3 Write property test for XP calculation
  - **Property 9: XP gain calculation is accurate**
  - **Validates: Requirements 4.3**

- [ ] 9.4 Write property test for hunting detection
  - **Property 10: XP increase triggers hunting status**
  - **Validates: Requirements 4.4**

- [ ] 9.5 Write property test for hunting display
  - **Property 11: Hunting session displays duration and total XP**
  - **Validates: Requirements 4.7**

- [ ] 10. Implement playtime scraper and analysis
- [ ] 10.1 Create playtime scraper
  - Implement GET request with player name as URL parameter
  - Parse HTML response with Cheerio
  - Extract playtime history data from rubinothings page
  - _Requirements: 5.1_

- [ ] 10.2 Implement playtime pattern analysis
  - Analyze playtime data to identify peak hours and days
  - Calculate activity frequency patterns
  - Store playtime patterns in database
  - _Requirements: 5.2, 5.3_

- [ ] 10.3 Write property test for pattern identification
  - **Property 12: Playtime pattern identification**
  - **Validates: Requirements 5.2**

- [ ] 10.4 Write property test for pattern persistence
  - **Property 13: Playtime data persistence**
  - **Validates: Requirements 5.3**

- [ ] 11. Implement task scheduler
- [ ] 11.1 Create cron-based task scheduler
  - Setup node-cron for task scheduling
  - Implement task locking mechanism to prevent concurrent executions (critical for 30s and 60s intervals to avoid CPU overload)
  - Schedule guild scraper (every 12 hours)
  - Schedule killboard scraper (every 30 seconds with lock check)
  - Schedule online players scraper (every 30 seconds with lock check)
  - Schedule highscores scraper (every 60 seconds with lock check)
  - Schedule playtime scraper (every 12 hours)
  - _Requirements: 1.4, 2.4, 3.4, 4.6, 5.4_

- [ ] 11.2 Write property test for scheduler
  - **Property 3: Scheduler triggers at configured intervals**
  - **Validates: Requirements 1.4, 2.4, 3.4, 4.6, 5.4**

- [ ] 12. Implement Discord bot integration
- [ ] 12.1 Create Discord bot service
  - Setup Discord.js bot with authentication
  - Implement connection management with auto-reconnect
  - Create notification formatting functions
  - _Requirements: 8.1, 8.5_

- [ ] 12.2 Implement Discord channel configuration
  - Create admin endpoints for Discord configuration
  - Implement channel-to-notification-type mapping
  - Store Discord configuration in database
  - _Requirements: 8.2, 8.4_

- [ ] 12.3 Implement notification routing
  - Create event listeners for killboard, online status, hunting, and member updates
  - Route notifications to configured channels
  - Format messages with embeds and timestamps
  - _Requirements: 8.3_

- [ ] 12.4 Write property test for notification routing
  - **Property 23: Discord notification routing**
  - **Validates: Requirements 8.3**

- [ ] 12.5 Write property test for notification completeness
  - **Property 24: Discord notification completeness**
  - **Validates: Requirements 8.5**

- [ ] 13. Implement backend API endpoints
- [ ] 13.1 Create player endpoints
  - Implement GET /api/players/:name for player status
  - Create GET /api/players/online/:serverId for online players
  - Implement GET /api/players/hunting/:serverId for hunting players
  - _Requirements: 3.2, 4.4_

- [ ] 13.2 Create guild endpoints
  - Implement GET /api/guilds for listing guilds
  - Create POST /api/guilds for adding guilds (admin only)
  - Implement PUT /api/guilds/:id for updating guilds (admin only)
  - Create DELETE /api/guilds/:id for removing guilds (admin only)
  - Implement GET /api/guilds/:id/members for guild members
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 13.3 Create killboard endpoints
  - Implement GET /api/deaths/:serverId for recent deaths
  - Add filtering by guild and time range
  - _Requirements: 2.3_

- [ ] 13.4 Create admin endpoints
  - Implement GET /api/admin/users/pending for pending users
  - Create POST /api/admin/users/:id/approve for user approval
  - Implement GET /api/admin/discord/config for Discord configuration
  - Create POST /api/admin/discord/config for Discord setup
  - _Requirements: 7.3, 7.4, 8.2_

- [ ] 14. Implement WebSocket server for real-time updates
- [ ] 14.1 Create WebSocket server with Socket.io
  - Setup Socket.io server with authentication
  - Implement connection handling
  - _Requirements: 10.1, 10.2_

- [ ] 14.2 Implement real-time data broadcasting
  - Create event emitters for data changes
  - Broadcast player status updates
  - Broadcast death events
  - Broadcast hunting activity updates
  - Send delta updates only
  - _Requirements: 10.1, 10.2_

- [ ] 14.3 Write property test for update mechanism
  - **Property 26: Updates without page reload**
  - **Validates: Requirements 10.2**

- [ ] 15. Implement frontend React application
- [ ] 15.1 Setup React project with TypeScript and TailwindCSS
  - Initialize React app with TypeScript
  - Configure TailwindCSS with medieval dark theme
  - Setup routing with React Router
  - Configure WebSocket client
  - _Requirements: 9.1, 9.4_

- [ ] 15.2 Create authentication components
  - Implement Login component
  - Create Registration component
  - Implement protected route wrapper
  - Create authentication context
  - _Requirements: 7.1_

- [ ] 15.3 Create dashboard layout
  - Implement main dashboard component
  - Create server selector dropdown
  - Implement navigation menu
  - _Requirements: 9.2, 11.4_

- [ ] 15.4 Create player card components
  - Implement PlayerCard component with status indicators
  - Create HuntingPlayerCard with XP stats
  - Add visual indicators for online/offline status
  - Display playtime patterns
  - _Requirements: 9.2, 4.7, 5.5_

- [ ] 15.5 Create killboard component
  - Implement death list component
  - Add filtering by ally/enemy
  - Display death events in real-time
  - _Requirements: 2.3, 2.5_

- [ ] 15.6 Implement admin panel
  - Create guild management interface
  - Implement user approval interface
  - Create Discord configuration interface
  - _Requirements: 6.1, 7.3, 8.1, 8.2_

- [ ] 15.7 Implement real-time updates
  - Connect WebSocket client to server
  - Implement auto-refresh every 5 seconds
  - Add visual indicators for updated elements
  - Ensure updates don't interrupt user interactions
  - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [ ] 15.8 Write property test for auto-refresh
  - **Property 25: Frontend auto-refresh interval**
  - **Validates: Requirements 10.1**

- [ ] 15.9 Write property test for visual indicators
  - **Property 27: Updated elements receive visual indicator**
  - **Validates: Requirements 10.4**

- [ ] 15.10 Write property test for non-interruption
  - **Property 28: Updates don't interrupt user interaction**
  - **Validates: Requirements 10.5**

- [ ] 16. Implement data filtering and isolation
- [ ] 16.1 Implement server-specific filtering
  - Add server filtering to all API endpoints
  - Implement frontend filtering by selected server
  - _Requirements: 11.4_

- [ ] 16.2 Implement scraper isolation
  - Ensure scrapers process servers independently
  - Add server-type-specific navigation logic
  - _Requirements: 11.3, 11.5_

- [ ] 16.3 Write property test for data filtering
  - **Property 29: Server-specific data filtering**
  - **Validates: Requirements 11.4**

- [ ] 16.4 Write property test for scraper isolation
  - **Property 30: Server-specific scraping isolation**
  - **Validates: Requirements 11.3**

- [ ] 16.5 Write property test for navigation strategy
  - **Property 31: Server type determines navigation strategy**
  - **Validates: Requirements 11.5**

- [ ] 17. Implement resilience and error handling
- [ ] 17.1 Add comprehensive error handling to scrapers
  - Implement parsing failure detection and alerts
  - Add invalid data skipping logic
  - _Requirements: 12.2, 12.3_

- [ ] 17.2 Write property test for parsing failures
  - **Property 33: Parsing failure triggers alert**
  - **Validates: Requirements 12.2**

- [ ] 17.3 Write property test for invalid data handling
  - **Property 34: Invalid data is skipped**
  - **Validates: Requirements 12.3**

- [ ] 18. Setup initial data and configuration
- [ ] 18.1 Seed database with servers
  - Create seed script for six servers (Auroria, Belaria, Vesperia, Bellum, Spectrum, Tenebrium)
  - Set correct server types (OpenPVP/RetroPVP)
  - _Requirements: 11.1_

- [ ] 18.2 Create initial admin user
  - Implement idempotent database seeding for user "pifot16" with password "Kx3nvqt1"
  - Check if user exists before creating to avoid overwriting password changes
  - Set admin and approved flags only on first creation
  - _Requirements: 7.6_

- [ ] 19. Configure Nginx reverse proxy
- [ ] 19.1 Create Nginx configuration
  - Setup reverse proxy for backend API
  - Configure WebSocket proxy
  - Setup static file serving for frontend
  - Add load balancing configuration
  - _Requirements: All_

- [ ] 20. Final integration and testing
- [ ] 20.1 Build and test Docker containers
  - Build all Docker images
  - Test docker-compose startup
  - Verify inter-container communication
  - Test health checks
  - _Requirements: All_

- [ ] 20.2 End-to-end testing
  - Test complete user registration and approval flow
  - Verify scraping workflows for all data sources
  - Test real-time updates in frontend
  - Verify Discord notifications
  - Test admin panel functionality
  - _Requirements: All_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
