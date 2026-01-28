import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
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

// GET /api/deaths/:serverId - Get recent deaths for a server
router.get(
  '/:serverId',
  authenticate,
  [
    param('serverId').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { serverId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const repository = getRepository();
      
      const deaths = await repository.getRecentDeaths(serverId, limit);
      
      res.json({
        success: true,
        data: deaths,
      });
    } catch (error) {
      logger.error('Get deaths failed', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
