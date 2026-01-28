import { Router, Request, Response } from 'express';
import { getServerService } from '../services/server.service';
import { authenticate } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/servers - Get all servers
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const serverService = getServerService();
    const servers = await serverService.getAllServers();
    
    res.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    logger.error('Get servers failed', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/servers/:id - Get server by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const serverService = getServerService();
    
    const server = await serverService.getServerById(id);
    
    if (!server) {
      res.status(404).json({ success: false, error: 'Server not found' });
      return;
    }
    
    res.json({
      success: true,
      data: server,
    });
  } catch (error) {
    logger.error('Get server failed', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
