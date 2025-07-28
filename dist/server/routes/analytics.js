"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../database");
const auth_1 = require("../middleware/auth");
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
exports.analyticsRoutes = router;
// POST /api/analytics/event
router.post('/event', auth_1.authenticateUser, async (req, res) => {
    try {
        const { event_type, properties } = req.body;
        await database_1.pool.query(`
      INSERT INTO analytics_events (id, user_id, organization_id, event_type, properties, session_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
            (0, uuid_1.v4)(),
            req.authContext.userId,
            req.authContext.organizationId,
            event_type,
            JSON.stringify(properties || {}),
            req.headers['x-session-id'] || null
        ]);
        res.json({
            success: true,
            data: {
                message: 'Event recorded successfully'
            }
        });
    }
    catch (error) {
        console.error('Record analytics event error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'ANALYTICS_RECORD_FAILED',
                message: 'Failed to record analytics event'
            }
        });
    }
});
// GET /api/analytics/dashboard
router.get('/dashboard', auth_1.authenticateUser, (0, auth_1.requirePermission)('analytics:view'), async (req, res) => {
    try {
        const organizationId = req.authContext.organizationId;
        // Get basic metrics
        const [usageResult, eventsResult, watchlistResult] = await Promise.all([
            database_1.pool.query(`
          SELECT 
            action_type,
            COUNT(*) as count,
            DATE_TRUNC('day', recorded_at) as date
          FROM usage_records 
          WHERE organization_id = $1 
            AND recorded_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY action_type, DATE_TRUNC('day', recorded_at)
          ORDER BY date DESC
        `, [organizationId]),
            database_1.pool.query(`
          SELECT 
            event_type,
            COUNT(*) as count
          FROM analytics_events 
          WHERE organization_id = $1 
            AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY event_type
          ORDER BY count DESC
        `, [organizationId]),
            database_1.pool.query(`
          SELECT COUNT(*) as watchlist_count
          FROM business_watchlist 
          WHERE organization_id = $1
        `, [organizationId])
        ]);
        const dashboard = {
            usage_trends: usageResult.rows,
            event_summary: eventsResult.rows,
            watchlist_count: parseInt(watchlistResult.rows[0]?.watchlist_count || '0'),
            generated_at: new Date().toISOString()
        };
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DASHBOARD_FETCH_FAILED',
                message: 'Failed to fetch dashboard data'
            }
        });
    }
});
