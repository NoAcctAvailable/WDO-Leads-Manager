import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      console.log(`🚫 Unauthorized API access attempt: ${req.method} ${req.path} from ${req.ip}`);
      throw createError('Authentication required. Please provide a valid Bearer token.', 401);
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (jwtError: any) {
      console.log(`🚫 Invalid token attempt: ${jwtError.message} from ${req.ip}`);
      if (jwtError.name === 'TokenExpiredError') {
        throw createError('Token has expired. Please login again.', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw createError('Invalid token format. Please login again.', 401);
      } else {
        throw createError('Token verification failed. Please login again.', 401);
      }
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        active: true,
        updatedAt: true 
      },
    });

    if (!user) {
      console.log(`🚫 Token for non-existent user: ${decoded.id} from ${req.ip}`);
      throw createError('User account not found. Please login again.', 401);
    }

    if (!user.active) {
      console.log(`🚫 Token for inactive user: ${user.email} from ${req.ip}`);
      throw createError('User account has been deactivated. Please contact administrator.', 401);
    }

    // Check if token was issued before user's last update (password change, etc.)
    const tokenIssuedAt = new Date(decoded.iat * 1000);
    if (user.updatedAt > tokenIssuedAt) {
      console.log(`🚫 Stale token detected for user: ${user.email} from ${req.ip}`);
      throw createError('Token is no longer valid. Please login again.', 401);
    }

    // Log successful authentication for audit trail
    console.log(`✅ Authenticated: ${user.email} (${user.role}) - ${req.method} ${req.path}`);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log(`🚫 Authorization check failed - no user found in request from ${req.ip}`);
      return next(createError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      console.log(`🚫 Insufficient permissions: ${req.user.email} (${req.user.role}) attempted to access ${req.method} ${req.path} requiring [${roles.join(', ')}]`);
      return next(createError(`Access denied. Required roles: ${roles.join(', ')}`, 403));
    }

    console.log(`✅ Authorized: ${req.user.email} (${req.user.role}) for ${req.method} ${req.path}`);
    next();
  };
};

// Middleware to validate API key for external integrations (if needed)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  const validApiKey = process.env.API_KEY;

  if (!validApiKey) {
    console.log('⚠️  API Key validation requested but no API_KEY environment variable set');
    return next(createError('API Key authentication not configured', 500));
  }

  if (!apiKey || apiKey !== validApiKey) {
    console.log(`🚫 Invalid API key attempt from ${req.ip}`);
    return next(createError('Invalid API key', 401));
  }

  console.log(`✅ Valid API key from ${req.ip}`);
  next();
};

// Security middleware to prevent common attacks
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent MIME type sniffing
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Cache control for sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
}; 