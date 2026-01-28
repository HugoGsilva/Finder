import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getAuthService } from '../services/auth.service';
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

// POST /api/auth/register - Register a new user
router.post(
  '/register',
  [
    body('username').isString().trim().isLength({ min: 3, max: 50 }),
    body('password').isString().isLength({ min: 6 }),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const authService = getAuthService();
      
      const user = await authService.register(username, password);
      
      res.status(201).json({
        success: true,
        data: user,
        message: 'Registration successful. Awaiting admin approval.',
      });
    } catch (error) {
      logger.error('Registration failed', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ success: false, error: message });
    }
  }
);

// POST /api/auth/login - Login user
router.post(
  '/login',
  [
    body('username').isString().trim().notEmpty(),
    body('password').isString().notEmpty(),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const authService = getAuthService();
      
      const result = await authService.login(username, password);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Login failed', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ success: false, error: message });
    }
  }
);

// GET /api/auth/me - Get current user info
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const authService = getAuthService();
    const user = await authService.getUserById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Get user failed', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/pending - Get pending users (admin only)
router.get('/pending', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const authService = getAuthService();
    const users = await authService.getPendingUsers(req.user!.userId);
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    logger.error('Get pending users failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/auth/approve/:userId - Approve a user (admin only)
router.post('/approve/:userId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authService = getAuthService();
    
    const user = await authService.approveUser(userId, req.user!.userId);
    
    res.json({
      success: true,
      data: user,
      message: 'User approved successfully',
    });
  } catch (error) {
    logger.error('Approve user failed', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
