import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { getRepository } from '../database';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

const validateRequest = (req: Request, res: Response, next: Function): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

// GET /api/players/:serverId/online - Get online players for a server
router.get(
  '/:serverId/online',
  authenticate,
  [param('serverId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const repository = getRepository();
      
      const players = await repository.getOnlinePlayers(serverId);
      
      res.json({
        success: true,
        data: players,
      });
    } catch (error) {
      logger.error('Get online players failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/players/:serverId/hunting - Get hunting players for a server
router.get(
  '/:serverId/hunting',
  authenticate,
  [param('serverId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const repository = getRepository();
      
      const players = await repository.getHuntingPlayers(serverId);
      
      // Get hunting session data for each player
      const playersWithSessions = await Promise.all(
        players.map(async (player) => {
          const session = await repository.getActiveHuntingSession(player.id);
          
          let huntingStats = null;
          if (session) {
            const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000 / 60);
            const xpPerMinute = duration > 0 ? Number(session.xpGained) / duration : 0;
            
            huntingStats = {
              sessionDuration: duration,
              xpGained: session.xpGained.toString(),
              xpPerMinute: xpPerMinute.toFixed(0),
              startTime: session.startTime,
            };
          }
          
          return {
            ...player,
            huntingStats,
          };
        })
      );
      
      res.json({
        success: true,
        data: playersWithSessions,
      });
    } catch (error) {
      logger.error('Get hunting players failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/players/:name/:serverId - Get player by name and server
router.get(
  '/:name/:serverId',
  authenticate,
  [
    param('name').isString().trim().notEmpty(),
    param('serverId').isUUID(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, serverId } = req.params;
      const repository = getRepository();
      
      const player = await repository.getPlayerByNameAndServer(name, serverId);
      
      if (!player) {
        res.status(404).json({ success: false, error: 'Player not found' });
        return;
      }
      
      // Get player status
      const status = await repository.getPlayerStatus(player.id);
      
      // Get playtime patterns
      const patterns = await repository.getPlaytimePatterns(player.id);
      
      res.json({
        success: true,
        data: {
          ...player,
          status,
          playtimePatterns: patterns,
        },
      });
    } catch (error) {
      logger.error('Get player failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
