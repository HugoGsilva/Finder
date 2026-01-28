import { Vocation } from '../types';

export class ParserUtils {
  // Parse player name excluding titles in parentheses
  // Property 1: Player name parsing excludes titles
  static parsePlayerName(fullName: string): string {
    // Remove anything in parentheses, including the parentheses
    const nameWithoutTitle = fullName.replace(/\s*\([^)]*\)/g, '').trim();
    return nameWithoutTitle;
  }

  // Parse vocation string to enum
  static parseVocation(vocationStr: string): Vocation {
    const normalized = vocationStr.trim();
    
    switch (normalized) {
      case 'Knight':
      case 'Elite Knight':
        return Vocation.ELITE_KNIGHT;
      case 'Sorcerer':
      case 'Master Sorcerer':
        return Vocation.MASTER_SORCERER;
      case 'Druid':
      case 'Elder Druid':
        return Vocation.ELDER_DRUID;
      case 'Paladin':
      case 'Royal Paladin':
        return Vocation.ROYAL_PALADIN;
      case 'None':
      default:
        return Vocation.NONE;
    }
  }

  // Parse level from string
  static parseLevel(levelStr: string): number {
    const level = parseInt(levelStr.replace(/[^0-9]/g, ''));
    return isNaN(level) ? 1 : level;
  }

  // Parse experience from string (supports large numbers with BigInt)
  // Property 9: XP gain calculation is accurate
  static parseExperience(expStr: string): bigint {
    const cleanStr = expStr.replace(/[^0-9]/g, '');
    try {
      return BigInt(cleanStr);
    } catch (error) {
      return BigInt(0);
    }
  }

  // Parse date from various formats
  static parseDate(dateStr: string): Date | null {
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  // Extract text content safely
  static extractText($: cheerio.CheerioAPI, selector: string, defaultValue: string = ''): string {
    try {
      return $(selector).text().trim() || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // Extract attribute safely
  static extractAttr($: cheerio.CheerioAPI, selector: string, attr: string, defaultValue: string = ''): string {
    try {
      return $(selector).attr(attr) || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  // Validate required field
  static validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`Required field missing: ${fieldName}`);
    }
  }

  // Parse time in format "HH:MM:SS" or "MMM DD YYYY, HH:MM:SS CET"
  static parseRubinotTime(timeStr: string): Date | null {
    try {
      // Try standard date format first
      let date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // Handle Rubinot-specific formats
      // Example: "Jan 27 2026, 14:30:00 CET"
      const cetMatch = timeStr.match(/(\w+)\s+(\d+)\s+(\d+),\s+(\d+):(\d+):(\d+)/);
      if (cetMatch) {
        const [, month, day, year, hours, minutes, seconds] = cetMatch;
        const monthMap: { [key: string]: number } = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        date = new Date(
          parseInt(year),
          monthMap[month],
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        );
        return date;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Build form payload for Rubinot pages
  static buildServerPayload(serverName: string): { [key: string]: string } {
    return {
      'server': serverName,
    };
  }

  // Build guild filter payload
  static buildGuildFilterPayload(serverName: string, guildName: string): { [key: string]: string } {
    return {
      'server': serverName,
      'guild': guildName,
    };
  }

  // Build highscores payload
  static buildHighscoresPayload(serverName: string, page: number = 1): { [key: string]: string | number } {
    return {
      'server': serverName,
      'page': page,
    };
  }

  // Random delay between requests
  static getRandomDelay(min: number = 1000, max: number = 3000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Delay execution
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
