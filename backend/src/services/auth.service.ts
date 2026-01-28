import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getRepository } from '../database';
import { User, UserPublic, AuthPayload, AuthResponse } from '../types';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;
const JWT_EXPIRATION = '24h';

export class AuthService {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_here';
    if (this.jwtSecret === 'your_jwt_secret_here') {
      logger.warn('Using default JWT secret. Please set JWT_SECRET in production!');
    }
  }

  async register(username: string, password: string): Promise<UserPublic> {
    const repository = getRepository();
    
    // Check if user already exists
    const existingUser = await repository.getUserByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (defaults to unapproved)
    const user = await repository.createUser(username, passwordHash);
    
    logger.info(`New user registered: ${username}`);

    return this.toPublicUser(user);
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const repository = getRepository();
    
    // Get user by username
    const user = await repository.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if user is approved
    if (!user.isApproved) {
      throw new Error('Account pending approval');
    }

    // Generate JWT token
    const token = this.generateToken(user);
    
    logger.info(`User logged in: ${username}`);

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async approveUser(userId: string, adminId: string): Promise<UserPublic> {
    const repository = getRepository();

    // Verify admin exists and is admin
    const admin = await repository.getUserById(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Error('Unauthorized: Admin privileges required');
    }

    // Approve user
    const user = await repository.approveUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User ${user.username} approved by admin ${admin.username}`);

    return this.toPublicUser(user);
  }

  async getPendingUsers(adminId: string): Promise<UserPublic[]> {
    const repository = getRepository();

    // Verify admin exists and is admin
    const admin = await repository.getUserById(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Error('Unauthorized: Admin privileges required');
    }

    const users = await repository.getPendingUsers();
    return users.map(u => this.toPublicUser(u));
  }

  async getUserById(userId: string): Promise<UserPublic | null> {
    const repository = getRepository();
    const user = await repository.getUserById(userId);
    return user ? this.toPublicUser(user) : null;
  }

  verifyToken(token: string): AuthPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  private generateToken(user: User): string {
    const payload: AuthPayload = {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: JWT_EXPIRATION });
  }

  private toPublicUser(user: User): UserPublic {
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
    };
  }
}

// Singleton instance
let authServiceInstance: AuthService | null = null;

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}
