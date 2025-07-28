"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessRoutes = void 0;
const express_1 = require("express");
const businessService_1 = require("../services/businessService");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
exports.businessRoutes = router;
// Validation schemas
const searchSchema = zod_1.z.object({
    keywords: zod_1.z.string().optional(),
    industry: zod_1.z.array(zod_1.z.string()).optional(),
    location: zod_1.z.object({
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        radius: zod_1.z.number().optional()
    }).optional(),
    financial_filters: zod_1.z.object({
        min_price: zod_1.z.number().optional(),
        max_price: zod_1.z.number().optional(),
        min_revenue: zod_1.z.number().optional(),
        max_revenue: zod_1.z.number().optional(),
        min_cash_flow: zod_1.z.number().optional(),
        max_cash_flow: zod_1.z.number().optional()
    }).optional(),
    sort_by: zod_1.z.enum(['price', 'revenue', 'cash_flow', 'quality_score', 'created_at']).optional(),
    sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    limit: zod_1.z.number().min(1).max(100).optional(),
    offset: zod_1.z.number().min(0).optional()
});
const watchlistSchema = zod_1.z.object({
    notes: zod_1.z.string().optional()
});
// GET /api/business/search
router.get('/search', auth_1.optionalAuth, (0, auth_1.checkFeatureAccess)('searches'), (0, auth_1.recordUsage)('search'), async (req, res) => {
    try {
        const query = searchSchema.parse({
            keywords: req.query.keywords,
            industry: req.query.industry ? (Array.isArray(req.query.industry) ? req.query.industry : [req.query.industry]) : undefined,
            location: {
                city: req.query.city,
                state: req.query.state,
                radius: req.query.radius ? parseInt(req.query.radius) : undefined
            },
            financial_filters: {
                min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
                max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
                min_revenue: req.query.min_revenue ? parseFloat(req.query.min_revenue) : undefined,
                max_revenue: req.query.max_revenue ? parseFloat(req.query.max_revenue) : undefined,
                min_cash_flow: req.query.min_cash_flow ? parseFloat(req.query.min_cash_flow) : undefined,
                max_cash_flow: req.query.max_cash_flow ? parseFloat(req.query.max_cash_flow) : undefined
            },
            sort_by: req.query.sort_by,
            sort_order: req.query.sort_order,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            offset: req.query.offset ? parseInt(req.query.offset) : undefined
        });
        const results = await businessService_1.businessService.search(query, req.authContext?.organizationId);
        // Apply tier-based filtering for unauthenticated or limited tier users
        if (!req.authContext || req.authContext.subscriptionTier === 'starter') {
            results.listings = results.listings.map(listing => ({
                ...listing,
                contact_info: {}, // Hide contact info for starter tier
                financial_data: {
                    asking_price: listing.financial_data.asking_price,
                    // Hide detailed financials for starter tier
                }
            }));
            results.tier_limited = true;
        }
        res.json({
            success: true,
            data: results,
            pagination: {
                total: results.total_count,
                limit: query.limit || 20,
                offset: query.offset || 0,
                has_more: results.has_more
            }
        });
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'SEARCH_FAILED',
                message: error.message || 'Failed to search business listings'
            }
        });
    }
});
// GET /api/business/:id
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    try {
        const business = await businessService_1.businessService.getById(req.params.id, req.authContext?.organizationId);
        if (!business) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'BUSINESS_NOT_FOUND',
                    message: 'Business listing not found'
                }
            });
        }
        // Apply tier-based data filtering
        if (!req.authContext || req.authContext.subscriptionTier === 'starter') {
            business.contact_info = {}; // Hide contact info
            business.financial_data = {
                asking_price: business.financial_data.asking_price,
                // Hide detailed financials
            };
        }
        res.json({
            success: true,
            data: business
        });
    }
    catch (error) {
        console.error('Get business error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'BUSINESS_FETCH_FAILED',
                message: 'Failed to fetch business listing'
            }
        });
    }
});
// POST /api/business/export
router.post('/export', auth_1.authenticateUser, (0, auth_1.requirePermission)('business:export'), (0, auth_1.checkFeatureAccess)('exports'), (0, auth_1.recordUsage)('export'), async (req, res) => {
    try {
        const query = searchSchema.parse(req.body.query);
        const format = req.body.format === 'json' ? 'json' : 'csv';
        const exportData = await businessService_1.businessService.exportSearchResults(query, req.authContext.organizationId, format);
        const filename = `business-listings-${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
        res.send(exportData);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'EXPORT_FAILED',
                message: error.message || 'Failed to export business listings'
            }
        });
    }
});
// POST /api/business/:id/watchlist
router.post('/:id/watchlist', auth_1.authenticateUser, (0, auth_1.requirePermission)('business:watchlist'), async (req, res) => {
    try {
        const { notes } = watchlistSchema.parse(req.body);
        await businessService_1.businessService.addToWatchlist(req.authContext.userId, req.authContext.organizationId, req.params.id, notes);
        res.json({
            success: true,
            data: {
                message: 'Added to watchlist successfully'
            }
        });
    }
    catch (error) {
        console.error('Add to watchlist error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'WATCHLIST_ADD_FAILED',
                message: error.message || 'Failed to add to watchlist'
            }
        });
    }
});
// DELETE /api/business/:id/watchlist
router.delete('/:id/watchlist', auth_1.authenticateUser, (0, auth_1.requirePermission)('business:watchlist'), async (req, res) => {
    try {
        await businessService_1.businessService.removeFromWatchlist(req.authContext.userId, req.params.id);
        res.json({
            success: true,
            data: {
                message: 'Removed from watchlist successfully'
            }
        });
    }
    catch (error) {
        console.error('Remove from watchlist error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'WATCHLIST_REMOVE_FAILED',
                message: error.message || 'Failed to remove from watchlist'
            }
        });
    }
});
// GET /api/business/watchlist
router.get('/watchlist', auth_1.authenticateUser, (0, auth_1.requirePermission)('business:watchlist'), async (req, res) => {
    try {
        const watchlist = await businessService_1.businessService.getWatchlist(req.authContext.userId, req.authContext.organizationId);
        res.json({
            success: true,
            data: watchlist
        });
    }
    catch (error) {
        console.error('Get watchlist error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'WATCHLIST_FETCH_FAILED',
                message: 'Failed to fetch watchlist'
            }
        });
    }
});
// POST /api/business/:id/due-diligence
router.post('/:id/due-diligence', auth_1.authenticateUser, (0, auth_1.requirePermission)('reports:generate'), (0, auth_1.requireSubscriptionTier)('professional'), async (req, res) => {
    try {
        const report = await businessService_1.businessService.generateDueDiligenceReport(req.params.id, req.authContext.organizationId);
        res.json({
            success: true,
            data: report
        });
    }
    catch (error) {
        console.error('Due diligence report error:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'REPORT_GENERATION_FAILED',
                message: error.message || 'Failed to generate due diligence report'
            }
        });
    }
});
// GET /api/business/industries
router.get('/industries', async (req, res) => {
    try {
        // This would typically come from a database query
        const industries = [
            'Accounting & Finance',
            'Automotive',
            'Beauty & Personal Care',
            'Construction',
            'E-commerce',
            'Education & Training',
            'Food & Beverage',
            'Healthcare',
            'Manufacturing',
            'Professional Services',
            'Real Estate',
            'Retail',
            'Technology',
            'Transportation',
            'Other'
        ];
        res.json({
            success: true,
            data: industries
        });
    }
    catch (error) {
        console.error('Get industries error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INDUSTRIES_FETCH_FAILED',
                message: 'Failed to fetch industries'
            }
        });
    }
});
// GET /api/business/states
router.get('/states', async (req, res) => {
    try {
        const states = [
            { code: 'AL', name: 'Alabama' },
            { code: 'AK', name: 'Alaska' },
            { code: 'AZ', name: 'Arizona' },
            { code: 'AR', name: 'Arkansas' },
            { code: 'CA', name: 'California' },
            { code: 'CO', name: 'Colorado' },
            { code: 'CT', name: 'Connecticut' },
            { code: 'DE', name: 'Delaware' },
            { code: 'FL', name: 'Florida' },
            { code: 'GA', name: 'Georgia' },
            { code: 'HI', name: 'Hawaii' },
            { code: 'ID', name: 'Idaho' },
            { code: 'IL', name: 'Illinois' },
            { code: 'IN', name: 'Indiana' },
            { code: 'IA', name: 'Iowa' },
            { code: 'KS', name: 'Kansas' },
            { code: 'KY', name: 'Kentucky' },
            { code: 'LA', name: 'Louisiana' },
            { code: 'ME', name: 'Maine' },
            { code: 'MD', name: 'Maryland' },
            { code: 'MA', name: 'Massachusetts' },
            { code: 'MI', name: 'Michigan' },
            { code: 'MN', name: 'Minnesota' },
            { code: 'MS', name: 'Mississippi' },
            { code: 'MO', name: 'Missouri' },
            { code: 'MT', name: 'Montana' },
            { code: 'NE', name: 'Nebraska' },
            { code: 'NV', name: 'Nevada' },
            { code: 'NH', name: 'New Hampshire' },
            { code: 'NJ', name: 'New Jersey' },
            { code: 'NM', name: 'New Mexico' },
            { code: 'NY', name: 'New York' },
            { code: 'NC', name: 'North Carolina' },
            { code: 'ND', name: 'North Dakota' },
            { code: 'OH', name: 'Ohio' },
            { code: 'OK', name: 'Oklahoma' },
            { code: 'OR', name: 'Oregon' },
            { code: 'PA', name: 'Pennsylvania' },
            { code: 'RI', name: 'Rhode Island' },
            { code: 'SC', name: 'South Carolina' },
            { code: 'SD', name: 'South Dakota' },
            { code: 'TN', name: 'Tennessee' },
            { code: 'TX', name: 'Texas' },
            { code: 'UT', name: 'Utah' },
            { code: 'VT', name: 'Vermont' },
            { code: 'VA', name: 'Virginia' },
            { code: 'WA', name: 'Washington' },
            { code: 'WV', name: 'West Virginia' },
            { code: 'WI', name: 'Wisconsin' },
            { code: 'WY', name: 'Wyoming' }
        ];
        res.json({
            success: true,
            data: states
        });
    }
    catch (error) {
        console.error('Get states error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'STATES_FETCH_FAILED',
                message: 'Failed to fetch states'
            }
        });
    }
});
