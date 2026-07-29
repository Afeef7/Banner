import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById } from '../db/firebase';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dr-banner-access-super-secret-key-123';

// Extend Express Request typing inline
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'admin' | 'candidate';
      };
    }
  }
}

// 1. Verify Access Token JWT Middleware
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'ACCESS_TOKEN_REQUIRED',
        message: 'A valid Bearer token is required in the Authorization header'
      }
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // 1. Check if token is a Firebase ID token (JWT issued by securetoken.google.com)
  const decodedToken: any = jwt.decode(token);
  if (decodedToken && decodedToken.iss && decodedToken.iss.includes("securetoken.google.com")) {
    try {
      const userId = decodedToken.sub || decodedToken.uid;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_ACCESS_TOKEN',
            message: 'No user ID claim found in the Firebase token'
          }
        });
        return;
      }

      // Lookup to ensure user exists in Firestore
      const user = await getUserById(userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_DELETED',
            message: 'The user account associated with this token has been deprovisioned'
          }
        });
        return;
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as 'admin' | 'candidate'
      };

      next();
      return;
    } catch (error) {
      console.error("Auth middleware Firebase user lookup error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during user verification'
        }
      });
      return;
    }
  }

  // 2. Fallback to custom JWT secret verification
  jwt.verify(token, ACCESS_TOKEN_SECRET, async (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_ACCESS_TOKEN',
          message: 'The access token is expired, tampered, or invalid'
        }
      });
    }

    try {
      // Lookup to ensure user exists in Firestore
      const user = await getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_DELETED',
            message: 'The user account associated with this token has been deprovisioned'
          }
        });
      }

      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as 'admin' | 'candidate'
      };

      next();
    } catch (error) {
      console.error("Auth middleware user lookup error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during user verification'
        }
      });
    }
  });
};

// 2. Role Enforcement Middleware (Candidate / Admin)
export const enforceRole = (allowedRoles: ('admin' | 'candidate')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication context is missing'
        }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
        }
      });
      return;
    }

    next();
  };
};
