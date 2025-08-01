import { Router } from 'express';
import { businessService } from '../services/businessService';
import { subscriptionService } from '../services/subscriptionService';
import TierAccessService from '../services/tier-access';
import BookRecommendationService from '../services/book-recommendations';
import { 
  authenticateUser, 
  checkFeatureAccess, 
  recordUsage, 
  requirePermission,
  requireSubscriptionTier,
  optionalAuth 
} from '../middleware/auth';
import { z } from 'zod';
import { pool } from '../database/index';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  keywords: z.string().optional(),
  industry: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    radius: z.number().optional()
  }).optional(),
  financial_filters: z.object({
    min_price: z.number().optional(),
    max_price: z.number().optional(),
    min_revenue: z.number().optional(),
    max_revenue: z.number().optional(),
    min_cash_flow: z.number().optional(),
    max_cash_flow: z.number().optional()
  }).optional(),
  sort_by: z.enum(['price', 'revenue', 'cash_flow', 'quality_score', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

const watchlistSchema = z.object({
  notes: z.string().optional()
});

// GET /api/business/search - Tier-based search with usage tracking
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const userId = req.authContext?.userId;
    const userTier = req.authContext?.subscriptionTier || 'starter';
    
    // Check tier access and usage limits
    if (userId) {
      const accessCheck = await TierAccessService.checkUserAccess(userId, 'search');
      if (!accessCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'SEARCH_LIMIT_EXCEEDED',
            message: `Monthly search limit reached for ${accessCheck.tier} tier`,
            usage: accessCheck.usage
          }
        });
      }
    }

    const query = searchSchema.parse({
      keywords: req.query.keywords,
      industry: req.query.industry ? (Array.isArray(req.query.industry) ? req.query.industry : [req.query.industry]) : undefined,
      location: {
        city: req.query.city as string,
        state: req.query.state as string,
        radius: req.query.radius ? parseInt(req.query.radius as string) : undefined
      },
      financial_filters: {
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        min_revenue: req.query.min_revenue ? parseFloat(req.query.min_revenue as string) : undefined,
        max_revenue: req.query.max_revenue ? parseFloat(req.query.max_revenue as string) : undefined,
        min_cash_flow: req.query.min_cash_flow ? parseFloat(req.query.min_cash_flow as string) : undefined,
        max_cash_flow: req.query.max_cash_flow ? parseFloat(req.query.max_cash_flow as string) : undefined
      },
      sort_by: req.query.sort_by as any,
      sort_order: req.query.sort_order as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    });

    // Execute search
    const client = await pool.connect();
    let searchQuery = `
      SELECT b.*, 
             COALESCE(array_agg(s.source) FILTER (WHERE s.source IS NOT NULL), '{}') as data_sources
      FROM businesses b
      LEFT JOIN business_sources s ON b.id = s.business_id
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramCount = 0;

    // Apply search filters
    if (query.keywords) {
      paramCount++;
      searchQuery += ` AND (b.name ILIKE $${paramCount} OR b.description ILIKE $${paramCount})`;
      queryParams.push(`%${query.keywords}%`);
    }

    if (query.industry && query.industry.length > 0) {
      paramCount++;
      searchQuery += ` AND b.industry = ANY($${paramCount})`;
      queryParams.push(query.industry);
    }

    if (query.location?.city) {
      paramCount++;
      searchQuery += ` AND b.location->>'city' ILIKE $${paramCount}`;
      queryParams.push(`%${query.location.city}%`);
    }

    if (query.location?.state) {
      paramCount++;
      searchQuery += ` AND b.location->>'state' = $${paramCount}`;
      queryParams.push(query.location.state);
    }

    if (query.financial_filters?.min_price) {
      paramCount++;
      searchQuery += ` AND (b.financial_data->>'asking_price')::numeric >= $${paramCount}`;
      queryParams.push(query.financial_filters.min_price);
    }

    if (query.financial_filters?.max_price) {
      paramCount++;
      searchQuery += ` AND (b.financial_data->>'asking_price')::numeric <= $${paramCount}`;
      queryParams.push(query.financial_filters.max_price);
    }

    searchQuery += ` GROUP BY b.id`;
    
    // Apply sorting
    const sortBy = query.sort_by || 'created_at';
    const sortOrder = query.sort_order || 'desc';
    searchQuery += ` ORDER BY b.${sortBy} ${sortOrder}`;
    
    // Apply pagination
    const limit = Math.min(query.limit || 20, userTier === 'starter' ? 10 : 50);
    const offset = query.offset || 0;
    paramCount++;
    searchQuery += ` LIMIT $${paramCount}`;
    queryParams.push(limit);
    paramCount++;
    searchQuery += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    const result = await client.query(searchQuery, queryParams);
    client.release();

    // Filter data based on user tier
    const filteredBusinesses = userId 
      ? await TierAccessService.filterBusinessDataByTier(userId, result.rows)
      : result.rows.map(business => ({
          id: business.id,
          name: business.name,
          industry: business.industry,
          location: business.location,
          financial_data: {
            asking_price: business.financial_data?.asking_price,
            price_range: getPriceRange(business.financial_data?.asking_price || 0)
          },
          quality_score: business.quality_score,
          created_at: business.created_at,
          tier_access_level: 'starter'
        }));

    // Get book recommendations based on search results
    const bookRecommendations = query.industry && query.industry.length > 0
      ? BookRecommendationService.getRecommendationsByIndustry(query.industry[0], userTier)
      : BookRecommendationService.getRecommendationsByBusinessStage('research', userTier);

    // Increment usage if authenticated
    if (userId) {
      await TierAccessService.incrementUsage(userId, 'search');
    }

    res.json({
      success: true,
      data: {
        listings: filteredBusinesses,
        total_count: result.rowCount,
        has_more: result.rowCount === limit,
        tier_limited: userTier === 'starter',
        book_recommendations: bookRecommendations,
        affiliate_disclaimer: "Cash Flow Finder may earn commission from affiliate partners"
      },
      pagination: {
        total: result.rowCount,
        limit,
        offset,
        has_more: result.rowCount === limit
      }
    });
  } catch (error: any) {
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

function getPriceRange(price: number): string {
  if (price < 50000) return 'Under $50K';
  if (price < 100000) return '$50K - $100K';
  if (price < 250000) return '$100K - $250K';
  if (price < 500000) return '$250K - $500K';
  if (price < 1000000) return '$500K - $1M';
  return 'Over $1M';
}

// GET /api/business/:id - Business details with affiliate recommendations
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.authContext?.userId;
    const userTier = req.authContext?.subscriptionTier || 'starter';
    const businessId = req.params.id;

    // Get business from database
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM businesses WHERE id = $1',
      [businessId]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUSINESS_NOT_FOUND',
          message: 'Business listing not found'
        }
      });
    }

    const business = result.rows[0];

    // Filter data based on user tier
    const filteredBusiness = userId 
      ? (await TierAccessService.filterBusinessDataByTier(userId, [business]))[0]
      : {
          id: business.id,
          name: business.name,
          industry: business.industry,
          location: business.location,
          financial_data: {
            asking_price: business.financial_data?.asking_price,
            price_range: getPriceRange(business.financial_data?.asking_price || 0)
          },
          quality_score: business.quality_score,
          description: business.description,
          created_at: business.created_at,
          tier_access_level: 'starter'
        };

    // Get tier-appropriate recommendations
    const bookRecommendations = business.industry 
      ? BookRecommendationService.getRecommendationsByIndustry(business.industry, userTier)
      : BookRecommendationService.getRecommendationsByFinancialData(business.financial_data, userTier);

    // Get affiliate partner recommendations based on business stage
    const serviceRecommendations = userId ? await TierAccessService.getAffiliateRecommendations(
      userId, 
      businessId, 
      'financing'
    ) : [];

    const legalRecommendations = userId ? await TierAccessService.getAffiliateRecommendations(
      userId,
      businessId,
      'legal'
    ) : [];

    const dueDiligenceRecommendations = userId ? await TierAccessService.getAffiliateRecommendations(
      userId,
      businessId,
      'due_diligence'
    ) : [];

    // Business analysis recommendations for premium tiers
    let analysisRecommendations: any[] = [];
    if (userTier === 'professional' || userTier === 'enterprise') {
      analysisRecommendations = [
        {
          title: 'ROI Analysis',
          description: 'Get detailed ROI projections and financial analysis',
          available: !!(filteredBusiness as any).roi_analysis,
          tier_required: 'professional'
        },
        {
          title: 'SBA Loan Qualification',
          description: 'Check SBA loan eligibility and qualification requirements',
          available: !!(filteredBusiness as any).sba_qualification,
          tier_required: 'professional'
        },
        {
          title: 'Due Diligence Report',
          description: 'Comprehensive risk assessment and business evaluation',
          available: !!(filteredBusiness as any).due_diligence_report,
          tier_required: 'professional'
        }
      ];
    }

    res.json({
      success: true,
      data: {
        business: filteredBusiness,
        recommendations: {
          books: bookRecommendations,
          financing_services: serviceRecommendations,
          legal_services: legalRecommendations,
          due_diligence_services: dueDiligenceRecommendations,
          analysis_tools: analysisRecommendations
        },
        upgrade_prompt: userTier === 'starter' ? {
          message: "Unlock full financial data, contact information, and professional analysis tools",
          cta: "Upgrade to Professional",
          benefits: [
            "Complete financial statements",
            "Direct contact information", 
            "ROI analysis and projections",
            "SBA loan qualification assessment",
            "Professional due diligence reports"
          ]
        } : null,
        affiliate_disclaimer: "Cash Flow Finder may earn commission from affiliate partners"
      }
    });
  } catch (error: any) {
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
router.post('/export', 
  authenticateUser, 
  requirePermission('business:export'),
  checkFeatureAccess('exports'),
  recordUsage('export'),
  async (req, res) => {
    try {
      const query = searchSchema.parse(req.body.query);
      const format = req.body.format === 'json' ? 'json' : 'csv';

      const exportData = await businessService.exportSearchResults(
        query,
        req.authContext!.organizationId,
        format
      );

      const filename = `business-listings-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      
      res.send(exportData);
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: error.message || 'Failed to export business listings'
        }
      });
    }
  }
);

// POST /api/business/:id/watchlist
router.post('/:id/watchlist', 
  authenticateUser, 
  requirePermission('business:watchlist'),
  async (req, res) => {
    try {
      const { notes } = watchlistSchema.parse(req.body);

      await businessService.addToWatchlist(
        req.authContext!.userId,
        req.authContext!.organizationId,
        req.params.id,
        notes
      );

      res.json({
        success: true,
        data: {
          message: 'Added to watchlist successfully'
        }
      });
    } catch (error: any) {
      console.error('Add to watchlist error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'WATCHLIST_ADD_FAILED',
          message: error.message || 'Failed to add to watchlist'
        }
      });
    }
  }
);

// DELETE /api/business/:id/watchlist
router.delete('/:id/watchlist', 
  authenticateUser, 
  requirePermission('business:watchlist'),
  async (req, res) => {
    try {
      await businessService.removeFromWatchlist(
        req.authContext!.userId,
        req.params.id
      );

      res.json({
        success: true,
        data: {
          message: 'Removed from watchlist successfully'
        }
      });
    } catch (error: any) {
      console.error('Remove from watchlist error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'WATCHLIST_REMOVE_FAILED',
          message: error.message || 'Failed to remove from watchlist'
        }
      });
    }
  }
);

// GET /api/business/watchlist
router.get('/watchlist', 
  authenticateUser, 
  requirePermission('business:watchlist'),
  async (req, res) => {
    try {
      const watchlist = await businessService.getWatchlist(
        req.authContext!.userId,
        req.authContext!.organizationId
      );

      res.json({
        success: true,
        data: watchlist
      });
    } catch (error: any) {
      console.error('Get watchlist error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WATCHLIST_FETCH_FAILED',
          message: 'Failed to fetch watchlist'
        }
      });
    }
  }
);

// POST /api/business/:id/due-diligence
router.post('/:id/due-diligence',
  authenticateUser,
  requirePermission('reports:generate'),
  requireSubscriptionTier('professional'),
  async (req, res) => {
    try {
      const report = await businessService.generateDueDiligenceReport(
        req.params.id,
        req.authContext!.organizationId
      );

      res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      console.error('Due diligence report error:', error);
      res.status(400).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: error.message || 'Failed to generate due diligence report'
        }
      });
    }
  }
);

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
  } catch (error: any) {
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
  } catch (error: any) {
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

export { router as businessRoutes };