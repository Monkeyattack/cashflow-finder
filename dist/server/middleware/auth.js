"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitUnauthenticated = exports.optionalAuth = exports.recordUsage = exports.requireSubscriptionTier = exports.checkFeatureAccess = exports.requirePermission = exports.authenticateUser = void 0;
const authService_1 = require("../services/authService");
const subscriptionService_1 = require("../services/subscriptionService");
const authenticateUser = async (req, res, next) => {
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
        let authContext = null;
        if (token.length > 100) { // Firebase tokens are longer
            authContext = await authService_1.authService.authenticateUser(token);
        }
        else {
            authContext = await authService_1.authService.verifyCustomToken(token);
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
    }
    catch (error) {
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
exports.authenticateUser = authenticateUser;
const requirePermission = (permission) => {
    return (req, res, next) => {
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
exports.requirePermission = requirePermission;
const checkFeatureAccess = (feature, usage = 1) => {
    return async (req, res, next) => {
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
            const accessResult = await subscriptionService_1.subscriptionService.checkAccess(req.authContext.organizationId, feature, usage);
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
                usage: usage || 1,
                remaining: accessResult.remaining_usage || 0
            };
            next();
        }
        catch (error) {
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
exports.checkFeatureAccess = checkFeatureAccess;
const requireSubscriptionTier = (minTier) => {
    const tierHierarchy = { starter: 0, professional: 1, enterprise: 2 };
    return (req, res, next) => {
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
exports.requireSubscriptionTier = requireSubscriptionTier;
const recordUsage = (actionType) => {
    return async (req, res, next) => {
        if (!req.authContext) {
            return next();
        }
        try {
            const featureAccess = req.authContext.featureAccess;
            const usage = 'usage' in featureAccess ? featureAccess.usage : 1;
            await subscriptionService_1.subscriptionService.recordUsage(req.authContext.organizationId, actionType, usage);
            next();
        }
        catch (error) {
            console.error('Usage recording error:', error);
            // Don't block the request if usage recording fails
            next();
        }
    };
};
exports.recordUsage = recordUsage;
// Middleware to handle optional authentication
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            let authContext = null;
            if (token.length > 100) {
                authContext = await authService_1.authService.authenticateUser(token);
            }
            else {
                authContext = await authService_1.authService.verifyCustomToken(token);
            }
            if (authContext) {
                req.authContext = authContext;
            }
        }
        next();
    }
    catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Rate limiting middleware for unauthenticated requests
const rateLimitUnauthenticated = (req, res, next) => {
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
exports.rateLimitUnauthenticated = rateLimitUnauthenticated;
