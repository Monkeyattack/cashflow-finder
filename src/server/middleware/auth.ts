import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { AuthContext, SubscriptionLimits } from '../../types';

// Extend Express Request type to include auth context
declare global {
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No valid authentication token provided'
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Try Firebase token first, then custom JWT
    let authContext: AuthContext | null = null;
    
    if (token.length > 100) { // Firebase tokens are longer
      authContext = await authService.authenticateUser(token);
    } else {
      authContext = await authService.verifyCustomToken(token);
    }

    if (!authContext) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token'
        }
      });
    }

    req.authContext = authContext;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication service error'
      }
    });
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!req.authContext.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Required: ${permission}`
        }
      });
    }

    next();
  };
};

export const checkFeatureAccess = (
  feature: keyof SubscriptionLimits,
  usage: number = 1
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED', 
          message: 'Authentication required'
        }
      });
    }

    try {
      const accessResult = await subscriptionService.checkAccess(
        req.authContext.organizationId,
        feature,
        usage
      );

      if (!accessResult.allowed) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FEATURE_ACCESS_DENIED',
            message: accessResult.reason
          },
          data: {
            remaining_usage: accessResult.remaining_usage
          }
        });
      }

      // Store access info for route handlers
      req.authContext.featureAccess = {
        feature,
        usage,
        remaining: accessResult.remaining_usage
      };

      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'ACCESS_CHECK_ERROR',
          message: 'Feature access verification failed'
        }
      });
    }
  };
};

export const requireSubscriptionTier = (minTier: 'starter' | 'professional' | 'enterprise') => {
  const tierHierarchy = { starter: 0, professional: 1, enterprise: 2 };
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    const userTierLevel = tierHierarchy[req.authContext.subscriptionTier];
    const requiredTierLevel = tierHierarchy[minTier];

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'TIER_UPGRADE_REQUIRED',
          message: `This feature requires ${minTier} tier or higher. Current tier: ${req.authContext.subscriptionTier}`
        },
        data: {
          current_tier: req.authContext.subscriptionTier,
          required_tier: minTier
        }
      });
    }

    next();
  };
};

export const recordUsage = (actionType: 'search' | 'export' | 'api_call') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return next();
    }

    try {
      const usage = req.authContext.featureAccess?.usage || 1;
      await subscriptionService.recordUsage(
        req.authContext.organizationId,
        actionType,
        usage
      );
      next();
    } catch (error) {
      console.error('Usage recording error:', error);
      // Don't block the request if usage recording fails
      next();
    }
  };
};

// Middleware to handle optional authentication
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      let authContext: AuthContext | null = null;
      
      if (token.length > 100) {
        authContext = await authService.authenticateUser(token);
      } else {
        authContext = await authService.verifyCustomToken(token);
      }

      if (authContext) {
        req.authContext = authContext;
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Rate limiting middleware for unauthenticated requests
export const rateLimitUnauthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.authContext) {
    // Apply stricter rate limits for unauthenticated users
    // This would integrate with express-rate-limit
    const rateLimit = require('express-rate-limit');
    
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 requests per windowMs
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please authenticate or try again later.'
        }
      }
    });

    return limiter(req, res, next);
  }
  
  next();
};