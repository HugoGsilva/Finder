import { Request, Response, NextFunction } from 'express';
import { getAuthService } from '../services/auth.service';
import { AuthPayload } from '../types';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Authentication middleware - requires valid JWT token
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ success: false, error: 'No authorization header' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, error: 'Invalid authorization format' });
      return;
    }

    const token = parts[1];
    const authService = getAuthService();
    const payload = authService.verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    logger.error('Authentication failed', error);
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Admin authorization middleware - requires admin privileges
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ success: false, error: 'Admin privileges required' });
    return;
  }

  next();
}

// Optional authentication - attaches user if token is valid, but doesn't require it
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const authService = getAuthService();
        const payload = authService.verifyToken(token);
        req.user = payload;
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }
  
  next();
}
