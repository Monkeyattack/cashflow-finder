"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = exports.SUBSCRIPTION_TIERS = void 0;
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../database");
const uuid_1 = require("uuid");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
// Subscription tier configuration matching implementation plan
exports.SUBSCRIPTION_TIERS = {
    starter: {
        price_monthly: 49,
        stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID,
        limits: {
            searches: 100,
            exports: 0,
            api_calls: 0,
            historical_data_months: 1,
            premium_analytics: false,
            api_access: false,
        },
        features: [
            '100 business searches/month',
            'Basic listing access',
            'Standard contact information',
            'Limited data history (30 days)',
            'Email support only'
        ]
    },
    professional: {
        price_monthly: 149,
        stripe_price_id: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        limits: {
            searches: 500,
            exports: 50,
            api_calls: 1000,
            historical_data_months: 12,
            premium_analytics: true,
            api_access: false,
        },
        features: [
            '500 business searches/month',
            'Advanced filtering',
            'Full contact data',
            'ROI calculation tools',
            'CSV exports',
            'Data enrichment',
            'SBA loan qualification assessments',
            '12-month data history',
            'Due diligence reports',
            'Priority support'
        ]
    },
    enterprise: {
        price_monthly: 399,
        stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID,
        limits: {
            searches: -1, // Unlimited
            exports: -1,
            api_calls: -1,
            historical_data_months: -1,
            premium_analytics: true,
            api_access: true,
        },
        features: [
            'Unlimited searches',
            'API access',
            'Custom integrations',
            'White-label options',
            'Advanced analytics',
            'Dedicated account manager',
            'Custom data feeds',
            'Bulk operations',
            'Comprehensive due diligence automation'
        ]
    }
};
class SubscriptionService {
    async createCustomer(email, name, organizationId) {
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                organization_id: organizationId,
            },
        });
        // Update organization with Stripe customer ID
        await database_1.pool.query('UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2', [customer.id, organizationId]);
        return customer;
    }
    async createSubscription(customerId, organizationId, tier, trialDays = 14) {
        const tierConfig = exports.SUBSCRIPTION_TIERS[tier];
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: tierConfig.stripe_price_id,
                },
            ],
            trial_period_days: trialDays,
            metadata: {
                organization_id: organizationId,
                tier: tier,
            },
        });
        // Record subscription in database
        await database_1.pool.query(`
      INSERT INTO subscriptions (id, organization_id, stripe_subscription_id, status, current_period_start, current_period_end)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
            (0, uuid_1.v4)(),
            organizationId,
            subscription.id,
            subscription.status,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000)
        ]);
        // Update organization tier
        await database_1.pool.query('UPDATE organizations SET subscription_tier = $1 WHERE id = $2', [tier, organizationId]);
        return subscription;
    }
    async checkAccess(organizationId, feature, usage = 1) {
        // Get organization subscription tier
        const orgResult = await database_1.pool.query(database_1.queries.getOrganization, [organizationId]);
        if (orgResult.rows.length === 0) {
            return { allowed: false, reason: 'Organization not found' };
        }
        const tier = orgResult.rows[0].subscription_tier;
        const limits = exports.SUBSCRIPTION_TIERS[tier].limits;
        // Check if feature is available for this tier
        if (feature === 'exports' && limits.exports === 0) {
            return { allowed: false, reason: 'Export feature not available in current plan' };
        }
        if (feature === 'api_access' && !limits.api_access) {
            return { allowed: false, reason: 'API access not available in current plan' };
        }
        if (feature === 'premium_analytics' && !limits.premium_analytics) {
            return { allowed: false, reason: 'Premium analytics not available in current plan' };
        }
        // Check usage limits (unlimited = -1)
        const featureLimit = limits[feature];
        if (typeof featureLimit === 'number' && featureLimit > 0) {
            const currentUsage = await this.getCurrentUsage(organizationId, feature);
            if (currentUsage + usage > featureLimit) {
                return {
                    allowed: false,
                    reason: 'Usage limit exceeded. Upgrade to continue.',
                    remaining_usage: Math.max(0, featureLimit - currentUsage)
                };
            }
            return {
                allowed: true,
                remaining_usage: featureLimit - currentUsage - usage
            };
        }
        return { allowed: true };
    }
    async getCurrentUsage(organizationId, feature) {
        const actionTypeMap = {
            searches: 'search',
            exports: 'export',
            api_calls: 'api_call'
        };
        const actionType = actionTypeMap[feature];
        if (!actionType)
            return 0;
        const result = await database_1.pool.query(`
      SELECT COALESCE(SUM(quantity), 0)::integer as usage
      FROM usage_records
      WHERE organization_id = $1 
        AND action_type = $2
        AND recorded_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [organizationId, actionType]);
        return result.rows[0]?.usage || 0;
    }
    async recordUsage(organizationId, actionType, quantity = 1) {
        await database_1.pool.query(database_1.queries.recordUsage, [
            (0, uuid_1.v4)(),
            organizationId,
            actionType,
            quantity
        ]);
    }
    async upgradeSubscription(organizationId, newTier) {
        // Get current subscription
        const subResult = await database_1.pool.query(`
      SELECT stripe_subscription_id FROM subscriptions 
      WHERE organization_id = $1 AND status = 'active'
    `, [organizationId]);
        if (subResult.rows.length === 0) {
            throw new Error('No active subscription found');
        }
        const subscriptionId = subResult.rows[0].stripe_subscription_id;
        const newTierConfig = exports.SUBSCRIPTION_TIERS[newTier];
        // Update Stripe subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
            items: [{
                    id: subscription.items.data[0].id,
                    price: newTierConfig.stripe_price_id,
                }],
            proration_behavior: 'create_prorations',
        });
        // Update database records
        await database_1.pool.query('UPDATE organizations SET subscription_tier = $1 WHERE id = $2', [newTier, organizationId]);
        return { success: true, newTier };
    }
    async cancelSubscription(organizationId) {
        const subResult = await database_1.pool.query(`
      SELECT stripe_subscription_id FROM subscriptions 
      WHERE organization_id = $1 AND status = 'active'
    `, [organizationId]);
        if (subResult.rows.length === 0) {
            throw new Error('No active subscription found');
        }
        const subscriptionId = subResult.rows[0].stripe_subscription_id;
        // Cancel at period end
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
        return { success: true, message: 'Subscription will cancel at the end of current period' };
    }
    async handleWebhook(event) {
        switch (event.type) {
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                await database_1.pool.query(`
          UPDATE subscriptions 
          SET 
            status = $1,
            current_period_start = $2,
            current_period_end = $3
          WHERE stripe_subscription_id = $4
        `, [
                    subscription.status,
                    new Date(subscription.current_period_start * 1000),
                    new Date(subscription.current_period_end * 1000),
                    subscription.id
                ]);
                // Update organization status if subscription cancelled
                if (subscription.status === 'canceled') {
                    const organizationId = subscription.metadata.organization_id;
                    await database_1.pool.query('UPDATE organizations SET subscription_tier = $1, status = $2 WHERE id = $3', ['starter', 'inactive', organizationId]);
                }
                break;
            case 'invoice.payment_failed':
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await database_1.pool.query(`
            UPDATE subscriptions 
            SET status = 'past_due'
            WHERE stripe_subscription_id = $1
          `, [invoice.subscription]);
                }
                break;
        }
    }
    async getSubscriptionStatus(organizationId) {
        const result = await database_1.pool.query(`
      SELECT 
        s.*,
        o.subscription_tier,
        o.status as org_status
      FROM subscriptions s
      JOIN organizations o ON s.organization_id = o.id  
      WHERE s.organization_id = $1 AND s.status = 'active'
    `, [organizationId]);
        if (result.rows.length === 0) {
            return null;
        }
        const subscription = result.rows[0];
        const tierConfig = exports.SUBSCRIPTION_TIERS[subscription.subscription_tier];
        return {
            ...subscription,
            tier_config: tierConfig,
            usage: await this.getUsageSummary(organizationId)
        };
    }
    async getUsageSummary(organizationId) {
        const result = await database_1.pool.query(database_1.queries.getCurrentUsage, [organizationId]);
        const usage = {};
        result.rows.forEach(row => {
            usage[row.action_type] = parseInt(row.total_usage);
        });
        return {
            searches: usage.search || 0,
            exports: usage.export || 0,
            api_calls: usage.api_call || 0
        };
    }
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
