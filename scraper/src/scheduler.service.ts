import cron from 'node-cron';
import { 
  GuildMembersScraper,
  OnlinePlayersScraper,
  KillboardScraper,
  HighscoresScraper,
  PlaytimeScraper
} from './scrapers';
import { logger } from './utils/logger';

export class SchedulerService {
  private guildMembersScraper: GuildMembersScraper;
  private onlinePlayersScraper: OnlinePlayersScraper;
  private killboardScraper: KillboardScraper;
  private highscoresScraper: HighscoresScraper;
  private playtimeScraper: PlaytimeScraper;

  private guildMembersTask: cron.ScheduledTask | null = null;
  private onlinePlayersTask: cron.ScheduledTask | null = null;
  private killboardTask: cron.ScheduledTask | null = null;
  private highscoresTask: cron.ScheduledTask | null = null;
  private playtimeTask: cron.ScheduledTask | null = null;

  // Locks to prevent concurrent executions - Property 3
  private isGuildMembersRunning = false;
  private isOnlinePlayersRunning = false;
  private isKillboardRunning = false;
  private isHighscoresRunning = false;
  private isPlaytimeRunning = false;

  constructor() {
    this.guildMembersScraper = new GuildMembersScraper();
    this.onlinePlayersScraper = new OnlinePlayersScraper();
    this.killboardScraper = new KillboardScraper();
    this.highscoresScraper = new HighscoresScraper();
    this.playtimeScraper = new PlaytimeScraper();
  }

  start(): void {
    logger.info('Starting scheduler service...');

    // Guild Members - Every 12 hours (0 0 */12 * * *)
    this.guildMembersTask = cron.schedule('0 0 */12 * * *', async () => {
      if (this.isGuildMembersRunning) {
        logger.warn('GuildMembersScraper is already running, skipping...');
        return;
      }

      this.isGuildMembersRunning = true;
      try {
        await this.guildMembersScraper.execute();
      } finally {
        this.isGuildMembersRunning = false;
      }
    });

    // Online Players - Every 30 seconds (*/30 * * * * *)
    this.onlinePlayersTask = cron.schedule('*/30 * * * * *', async () => {
      if (this.isOnlinePlayersRunning) {
        logger.warn('OnlinePlayersScraper is already running, skipping...');
        return;
      }

      this.isOnlinePlayersRunning = true;
      try {
        await this.onlinePlayersScraper.execute();
      } finally {
        this.isOnlinePlayersRunning = false;
      }
    });

    // Killboard - Every 30 seconds (*/30 * * * * *)
    this.killboardTask = cron.schedule('*/30 * * * * *', async () => {
      if (this.isKillboardRunning) {
        logger.warn('KillboardScraper is already running, skipping...');
        return;
      }

      this.isKillboardRunning = true;
      try {
        await this.killboardScraper.execute();
      } finally {
        this.isKillboardRunning = false;
      }
    });

    // Highscores - Every 60 seconds (*/60 * * * * *)
    this.highscoresTask = cron.schedule('0 * * * * *', async () => {
      if (this.isHighscoresRunning) {
        logger.warn('HighscoresScraper is already running, skipping...');
        return;
      }

      this.isHighscoresRunning = true;
      try {
        await this.highscoresScraper.execute();
      } finally {
        this.isHighscoresRunning = false;
      }
    });

    // Playtime - Every 12 hours (0 0 */12 * * *)
    this.playtimeTask = cron.schedule('0 0 */12 * * *', async () => {
      if (this.isPlaytimeRunning) {
        logger.warn('PlaytimeScraper is already running, skipping...');
        return;
      }

      this.isPlaytimeRunning = true;
      try {
        await this.playtimeScraper.execute();
      } finally {
        this.isPlaytimeRunning = false;
      }
    });

    logger.info('All scraper tasks scheduled successfully');
    logger.info('- Guild Members: Every 12 hours');
    logger.info('- Online Players: Every 30 seconds');
    logger.info('- Killboard: Every 30 seconds');
    logger.info('- Highscores: Every 60 seconds');
    logger.info('- Playtime: Every 12 hours');

    // Run initial scrapes immediately (optional)
    this.runInitialScrapes();
  }

  private async runInitialScrapes(): Promise<void> {
    logger.info('Running initial scrapes...');

    // Run guild members first
    setTimeout(async () => {
      if (!this.isGuildMembersRunning) {
        this.isGuildMembersRunning = true;
        try {
          await this.guildMembersScraper.execute();
        } finally {
          this.isGuildMembersRunning = false;
        }
      }
    }, 2000);

    // Then online players
    setTimeout(async () => {
      if (!this.isOnlinePlayersRunning) {
        this.isOnlinePlayersRunning = true;
        try {
          await this.onlinePlayersScraper.execute();
        } finally {
          this.isOnlinePlayersRunning = false;
        }
      }
    }, 5000);

    // Then killboard
    setTimeout(async () => {
      if (!this.isKillboardRunning) {
        this.isKillboardRunning = true;
        try {
          await this.killboardScraper.execute();
        } finally {
          this.isKillboardRunning = false;
        }
      }
    }, 8000);

    // Then highscores
    setTimeout(async () => {
      if (!this.isHighscoresRunning) {
        this.isHighscoresRunning = true;
        try {
          await this.highscoresScraper.execute();
        } finally {
          this.isHighscoresRunning = false;
        }
      }
    }, 11000);
  }

  stop(): void {
    logger.info('Stopping scheduler service...');

    if (this.guildMembersTask) {
      this.guildMembersTask.stop();
    }
    if (this.onlinePlayersTask) {
      this.onlinePlayersTask.stop();
    }
    if (this.killboardTask) {
      this.killboardTask.stop();
    }
    if (this.highscoresTask) {
      this.highscoresTask.stop();
    }
    if (this.playtimeTask) {
      this.playtimeTask.stop();
    }

    logger.info('All scraper tasks stopped');
  }

  getStatus() {
    return {
      guildMembers: {
        ...this.guildMembersScraper.getStatus(),
        isLocked: this.isGuildMembersRunning,
      },
      onlinePlayers: {
        ...this.onlinePlayersScraper.getStatus(),
        isLocked: this.isOnlinePlayersRunning,
      },
      killboard: {
        ...this.killboardScraper.getStatus(),
        isLocked: this.isKillboardRunning,
      },
      highscores: {
        ...this.highscoresScraper.getStatus(),
        isLocked: this.isHighscoresRunning,
      },
      playtime: {
        ...this.playtimeScraper.getStatus(),
        isLocked: this.isPlaytimeRunning,
      },
    };
  }
}

let schedulerInstance: SchedulerService | null = null;

export function getScheduler(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}
