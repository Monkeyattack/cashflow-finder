import { Router } from 'express';
import { subscriptionService, SUBSCRIPTION_TIERS } from '../services/subscriptionService';
import { authenticateUser, requirePermission } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Validation schemas
const upgradeSchema = z.object({
  tier: z.enum(['starter', 'professional', 'enterprise'])
});

// GET /api/subscription/tiers
router.get('/tiers', async (req, res) => {
  try {
    res.json({
      success: true,
      data: SUBSCRIPTION_TIERS
    });
  } catch (error: any) {
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
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(
      req.authContext!.organizationId
    );

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
  } catch (error: any) {
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
router.post('/upgrade', 
  authenticateUser, 
  requirePermission('billing:manage'),
  async (req, res) => {
    try {
      const { tier } = upgradeSchema.parse(req.body);

      const result = await subscriptionService.upgradeSubscription(
        req.authContext!.organizationId,
        tier
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'UPGRADE_FAILED',
          message: error.message || 'Failed to upgrade subscription'
        }
      });
    }
  }
);

// POST /api/subscription/cancel
router.post('/cancel',
  authenticateUser,
  requirePermission('billing:manage'),
  async (req, res) => {
    try {
      const result = await subscriptionService.cancelSubscription(
        req.authContext!.organizationId
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCEL_FAILED',
          message: error.message || 'Failed to cancel subscription'
        }
      });
    }
  }
);

// GET /api/subscription/usage
router.get('/usage', authenticateUser, async (req, res) => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(
      req.authContext!.organizationId
    );

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
        tier: req.authContext!.subscriptionTier
      }
    });
  } catch (error: any) {
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

export { router as subscriptionRoutes };