"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = void 0;
const express_1 = require("express");
const subscriptionService_1 = require("../services/subscriptionService");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.subscriptionRoutes = router;
// Validation schemas
const upgradeSchema = zod_1.z.object({
    tier: zod_1.z.enum(['starter', 'professional', 'enterprise'])
});
// GET /api/subscription/tiers
router.get('/tiers', async (req, res) => {
    try {
        res.json({
            success: true,
            data: subscriptionService_1.SUBSCRIPTION_TIERS
        });
    }
    catch (error) {
        console.error('Get tiers error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'TIERS_FETCH_FAILED',
                message: 'Failed to fetch subscription tiers'
            }
        });
    }
});
// GET /api/subscription/status
router.get('/status', auth_1.authenticateUser, async (req, res) => {
    try {
        const status = await subscriptionService_1.subscriptionService.getSubscriptionStatus(req.authContext.organizationId);
        if (!status) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'No active subscription found'
                }
            });
        }
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SUBSCRIPTION_STATUS_FAILED',
                message: 'Failed to fetch subscription status'
            }
        });
    }
});
// POST /api/subscription/upgrade
router.post('/upgrade', auth_1.authenticateUser, (0, auth_1.requirePermission)('billing:manage'), async (req, res) => {
    try {
        const { tier } = upgradeSchema.parse(req.body);
        const result = await subscriptionService_1.subscriptionService.upgradeSubscription(req.authContext.organizationId, tier);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Upgrade subscription error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'UPGRADE_FAILED',
                message: error.message || 'Failed to upgrade subscription'
            }
        });
    }
});
// POST /api/subscription/cancel
router.post('/cancel', auth_1.authenticateUser, (0, auth_1.requirePermission)('billing:manage'), async (req, res) => {
    try {
        const result = await subscriptionService_1.subscriptionService.cancelSubscription(req.authContext.organizationId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'CANCEL_FAILED',
                message: error.message || 'Failed to cancel subscription'
            }
        });
    }
});
// GET /api/subscription/usage
router.get('/usage', auth_1.authenticateUser, async (req, res) => {
    try {
        const status = await subscriptionService_1.subscriptionService.getSubscriptionStatus(req.authContext.organizationId);
        if (!status) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'SUBSCRIPTION_NOT_FOUND',
                    message: 'No subscription found'
                }
            });
        }
        res.json({
            success: true,
            data: {
                current_usage: status.usage,
                limits: status.tier_config.limits,
                tier: req.authContext.subscriptionTier
            }
        });
    }
    catch (error) {
        console.error('Get usage error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'USAGE_FETCH_FAILED',
                message: 'Failed to fetch usage information'
            }
        });
    }
});
