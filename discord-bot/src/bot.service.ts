import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { Pool } from 'pg';
import { getPool } from './database';
import { logger } from './utils/logger';

export interface DiscordNotification {
  type: 'killboard' | 'online_status' | 'hunting_activity' | 'member_updates';
  title: string;
  description: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  color?: number;
  timestamp?: Date;
}

export class DiscordBotService {
  private client: Client;
  private pool: Pool;
  private isReady: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    });

    this.pool = getPool();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
      this.isReady = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('disconnect', () => {
      logger.warn('Discord bot disconnected');
      this.isReady = false;
      this.handleReconnect();
    });

    this.client.on('reconnecting', () => {
      logger.info('Discord bot reconnecting...');
    });
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Manual intervention required.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(30000, 5000 * Math.pow(2, this.reconnectAttempts - 1));
    
    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        logger.error('Reconnection failed:', error);
        this.handleReconnect();
      }
    }, delay);
  }

  async start(): Promise<void> {
    const token = process.env.DISCORD_TOKEN;
    
    if (!token) {
      logger.warn('DISCORD_TOKEN not set, Discord bot will not start');
      return;
    }

    try {
      await this.client.login(token);
      logger.info('Discord bot started successfully');
    } catch (error) {
      logger.error('Failed to start Discord bot:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.isReady = false;
      logger.info('Discord bot stopped');
    }
  }

  getStatus(): { isReady: boolean; reconnectAttempts: number } {
    return {
      isReady: this.isReady,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Property 23: Discord notification routing
  async sendNotification(notification: DiscordNotification): Promise<void> {
    if (!this.isReady) {
      logger.warn('Discord bot not ready, skipping notification');
      return;
    }

    try {
      // Get configured channels for this notification type
      const result = await this.pool.query(
        `SELECT channel_id, discord_guild_id
         FROM discord_config
         WHERE notification_type = $1 AND is_enabled = true`,
        [notification.type]
      );

      if (result.rows.length === 0) {
        logger.debug(`No channels configured for notification type: ${notification.type}`);
        return;
      }

      // Property 24: Discord notification completeness (timestamp included)
      const embed = new EmbedBuilder()
        .setTitle(notification.title)
        .setDescription(notification.description)
        .setColor(notification.color || this.getColorForType(notification.type))
        .setTimestamp(notification.timestamp || new Date());

      if (notification.fields) {
        for (const field of notification.fields) {
          embed.addFields({ 
            name: field.name, 
            value: field.value, 
            inline: field.inline || false 
          });
        }
      }

      // Send to all configured channels
      for (const row of result.rows) {
        try {
          const channel = await this.client.channels.fetch(row.channel_id) as TextChannel;
          
          if (channel && channel.isTextBased()) {
            await channel.send({ embeds: [embed] });
            logger.debug(`Notification sent to channel ${row.channel_id}`);
          }
        } catch (error) {
          logger.error(`Failed to send notification to channel ${row.channel_id}:`, error);
          
          // Disable channel if it's invalid
          await this.pool.query(
            `UPDATE discord_config SET is_enabled = false WHERE channel_id = $1`,
            [row.channel_id]
          );
        }
      }
    } catch (error) {
      logger.error('Failed to send Discord notification:', error);
    }
  }

  private getColorForType(type: string): number {
    const colors: Record<string, number> = {
      killboard: 0xff0000,        // Red
      online_status: 0x00ff00,    // Green
      hunting_activity: 0xffa500, // Orange
      member_updates: 0x0000ff,   // Blue
    };
    return colors[type] || 0x808080; // Gray default
  }

  // Helper method to send death notification
  async sendDeathNotification(
    victimName: string,
    killerName: string | null,
    serverName: string,
    isAllyDeath: boolean
  ): Promise<void> {
    const notification: DiscordNotification = {
      type: 'killboard',
      title: `💀 ${isAllyDeath ? 'Ally' : 'Enemy'} Death`,
      description: `**${victimName}** was killed ${killerName ? `by **${killerName}**` : 'by environment'}`,
      fields: [
        { name: 'Server', value: serverName, inline: true },
        { name: 'Type', value: isAllyDeath ? '🟢 Ally' : '🔴 Enemy', inline: true },
      ],
      color: isAllyDeath ? 0xff0000 : 0x00ff00,
    };

    await this.sendNotification(notification);
  }

  // Helper method to send online status notification
  async sendOnlineStatusNotification(
    playerName: string,
    isOnline: boolean,
    serverName: string,
    level: number
  ): Promise<void> {
    const notification: DiscordNotification = {
      type: 'online_status',
      title: `${isOnline ? '🟢 Player Online' : '🔴 Player Offline'}`,
      description: `**${playerName}** is now ${isOnline ? 'online' : 'offline'}`,
      fields: [
        { name: 'Server', value: serverName, inline: true },
        { name: 'Level', value: level.toString(), inline: true },
      ],
      color: isOnline ? 0x00ff00 : 0xff0000,
    };

    await this.sendNotification(notification);
  }

  // Helper method to send hunting activity notification
  async sendHuntingNotification(
    playerName: string,
    xpGained: bigint,
    xpPerMinute: number,
    sessionDuration: number,
    serverName: string
  ): Promise<void> {
    const notification: DiscordNotification = {
      type: 'hunting_activity',
      title: '⚔️ Hunting Activity',
      description: `**${playerName}** is hunting`,
      fields: [
        { name: 'Server', value: serverName, inline: true },
        { name: 'XP Gained', value: xpGained.toString(), inline: true },
        { name: 'XP/min', value: xpPerMinute.toFixed(0), inline: true },
        { name: 'Duration', value: `${sessionDuration} minutes`, inline: true },
      ],
      color: 0xffa500,
    };

    await this.sendNotification(notification);
  }

  // Helper method to send member update notification
  async sendMemberUpdateNotification(
    guildName: string,
    memberName: string,
    action: 'joined' | 'left',
    serverName: string
  ): Promise<void> {
    const notification: DiscordNotification = {
      type: 'member_updates',
      title: `${action === 'joined' ? '➕' : '➖'} Guild Member Update`,
      description: `**${memberName}** ${action === 'joined' ? 'joined' : 'left'} **${guildName}**`,
      fields: [
        { name: 'Server', value: serverName, inline: true },
        { name: 'Guild', value: guildName, inline: true },
      ],
      color: action === 'joined' ? 0x0000ff : 0x808080,
    };

    await this.sendNotification(notification);
  }
}

// Singleton instance
let discordBotInstance: DiscordBotService | null = null;

export function getDiscordBot(): DiscordBotService {
  if (!discordBotInstance) {
    discordBotInstance = new DiscordBotService();
  }
  return discordBotInstance;
}
