import jwt from 'jsonwebtoken';
import { User } from '../../shared/schema';
import bcrypt from 'bcryptjs';
import { storage } from '../storage';

// Secret key for JWT signing - in production use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'luminateJwtSecret';
const JWT_EXPIRES_IN = '7d'; // Token expiration time

/**
 * Generate JWT token for a user
 */
export function generateToken(user: User): string {
  // Remove sensitive information from user object
  const { password, ...userInfo } = user;
  
  // Create and sign the token
  return jwt.sign(userInfo, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token and return decoded user data
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Register a new user
 */
export async function registerUser(username: string, email: string, password: string): Promise<User> {
  // Check if username or email already exists
  const existingUser = await storage.getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }
  
  const existingEmail = await storage.getUserByEmail(email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }
  
  // Create the user
  const newUser = await storage.createUser({
    username,
    email,
    password
  });
  
  return newUser;
}

/**
 * Authenticate a user and return token
 */
export async function authenticateUser(username: string, password: string): Promise<{user: User, token: string}> {
  // Find user
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate token
  const token = generateToken(user);
  
  return { user, token };
}

/**
 * Authentication middleware
 */
export async function requireAuth(req: any, res: any, next: any): Promise<void> {
  try {
    // Get token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Get fresh user data (optional, but provides the most up-to-date user information)
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user to request object
    req.user = user;
    
    // For backwards compatibility with session-based code
    if (!req.session) req.session = {};
    req.session.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}