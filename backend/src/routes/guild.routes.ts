import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getGuildService } from '../services/guild.service';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return;
  }
  next();
};

// GET /api/guilds - Get all guilds (optionally filtered by server)
router.get(
  '/',
  authenticate,
  [query('serverId').optional().isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.query;
      const guildService = getGuildService();
      
      const guilds = await guildService.getAllGuilds(serverId as string | undefined);
      
      res.json({
        success: true,
        data: guilds,
      });
    } catch (error) {
      logger.error('Get guilds failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/guilds/:id - Get guild by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const guildService = getGuildService();
      
      const guild = await guildService.getGuildById(id);
      
      if (!guild) {
        res.status(404).json({ success: false, error: 'Guild not found' });
        return;
      }
      
      res.json({
        success: true,
        data: guild,
      });
    } catch (error) {
      logger.error('Get guild failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// GET /api/guilds/:id/members - Get guild members
router.get(
  '/:id/members',
  authenticate,
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const guildService = getGuildService();
      
      const members = await guildService.getGuildMembers(id);
      
      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      logger.error('Get guild members failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// POST /api/guilds - Create a new guild (admin only)
router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('serverId').isUUID(),
    body('isAlly').isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, serverId, isAlly } = req.body;
      const guildService = getGuildService();
      
      const guild = await guildService.createGuild({ name, serverId, isAlly });
      
      res.status(201).json({
        success: true,
        data: guild,
        message: 'Guild created successfully',
      });
    } catch (error) {
      logger.error('Create guild failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// PUT /api/guilds/:id - Update a guild (admin only)
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('isAlly').optional().isBoolean(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, isAlly } = req.body;
      const guildService = getGuildService();
      
      const guild = await guildService.updateGuild(id, { name, isAlly });
      
      res.json({
        success: true,
        data: guild,
        message: 'Guild updated successfully',
      });
    } catch (error) {
      logger.error('Update guild failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// DELETE /api/guilds/:id - Delete a guild (admin only)
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const guildService = getGuildService();
      
      await guildService.deleteGuild(id);
      
      res.json({
        success: true,
        message: 'Guild deleted successfully',
      });
    } catch (error) {
      logger.error('Delete guild failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// GET /api/guilds/allies/:serverId - Get ally guilds for a server
router.get(
  '/allies/:serverId',
  authenticate,
  [param('serverId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const guildService = getGuildService();
      
      const guilds = await guildService.getAllyGuilds(serverId);
      
      res.json({
        success: true,
        data: guilds,
      });
    } catch (error) {
      logger.error('Get ally guilds failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

// GET /api/guilds/enemies/:serverId - Get enemy guilds for a server
router.get(
  '/enemies/:serverId',
  authenticate,
  [param('serverId').isUUID()],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const guildService = getGuildService();
      
      const guilds = await guildService.getEnemyGuilds(serverId);
      
      res.json({
        success: true,
        data: guilds,
      });
    } catch (error) {
      logger.error('Get enemy guilds failed', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(500).json({ success: false, error: message });
    }
  }
);

export default router;
