import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/config.js';

/**
 * Extended Express Request with user information
 * Added after successful JWT verification
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * Middleware: Verify JWT Token
 * Checks for valid Bearer token in Authorization header
 * Extracts user claims and attaches to request object
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required: Please provide a valid token'
    });
  }

  jwt.verify(token, JWT_CONFIG.SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token: Please log in again'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware: Role-Based Access Control
 * Validates user has required role before allowing request to proceed
 * Returns 403 Forbidden if user lacks required permissions
 */
export const authorizeRole = (requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: This action requires ${requiredRoles.join(' or ')} role`
      });
    }

    next();
  };
};
