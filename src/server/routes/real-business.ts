import { Router } from 'express';
import { pool } from '../database/index';

const router = Router();

// Real business search endpoint
router.get('/search', async (req, res) => {
  try {
    const {
      keywords,
      industry,
      location,
      min_price,
      max_price,
      min_revenue,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        id,
        name,
        industry,
        location,
        financial_data,
        description,
        quality_score,
        source,
        source_url,
        contact_info,
        created_at
      FROM businesses 
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (keywords) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      queryParams.push(`%${keywords}%`);
    }

    if (industry) {
      paramCount++;
      query += ` AND industry = $${paramCount}`;
      queryParams.push(industry);
    }

    if (location) {
      paramCount++;
      query += ` AND (location->>'city' ILIKE $${paramCount} OR location->>'state' ILIKE $${paramCount})`;
      queryParams.push(`%${location}%`);
    }

    if (min_price) {
      paramCount++;
      query += ` AND (financial_data->>'asking_price')::numeric >= $${paramCount}`;
      queryParams.push(parseInt(min_price.toString()));
    }

    if (max_price) {
      paramCount++;
      query += ` AND (financial_data->>'asking_price')::numeric <= $${paramCount}`;
      queryParams.push(parseInt(max_price.toString()));
    }

    if (min_revenue) {
      paramCount++;
      query += ` AND (financial_data->>'annual_revenue')::numeric >= $${paramCount}`;
      queryParams.push(parseInt(min_revenue.toString()));
    }

    // Add ordering and pagination
    query += ` ORDER BY quality_score DESC, created_at DESC`;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit.toString()));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(parseInt(offset.toString()));

    console.log('📊 Executing business search query:', query);
    console.log('🔍 Query parameters:', queryParams);

    const result = await pool.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) FROM businesses WHERE 1=1`;
    const countParams: any[] = [];
    let countParamCount = 0;

    // Apply same filters to count query
    if (keywords) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countParams.push(`%${keywords}%`);
    }

    if (industry) {
      countParamCount++;
      countQuery += ` AND industry = $${countParamCount}`;
      countParams.push(industry);
    }

    if (location) {
      countParamCount++;
      countQuery += ` AND (location->>'city' ILIKE $${countParamCount} OR location->>'state' ILIKE $${countParamCount})`;
      countParams.push(`%${location}%`);
    }

    if (min_price) {
      countParamCount++;
      countQuery += ` AND (financial_data->>'asking_price')::numeric >= $${countParamCount}`;
      countParams.push(parseInt(min_price.toString()));
    }

    if (max_price) {
      countParamCount++;
      countQuery += ` AND (financial_data->>'asking_price')::numeric <= $${countParamCount}`;
      countParams.push(parseInt(max_price.toString()));
    }

    if (min_revenue) {
      countParamCount++;
      countQuery += ` AND (financial_data->>'annual_revenue')::numeric >= $${countParamCount}`;
      countParams.push(parseInt(min_revenue.toString()));
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        listings: result.rows,
        total_count: totalCount,
        has_more: totalCount > (parseInt(offset.toString()) + result.rows.length),
        sources: {
          twitter: result.rows.filter(b => b.source === 'Twitter').length,
          reddit: result.rows.filter(b => b.source === 'Reddit').length,
          craigslist: result.rows.filter(b => b.source === 'Craigslist').length,
          bizbuysell: result.rows.filter(b => b.source === 'BizBuySell').length
        }
      }
    });

  } catch (error) {
    console.error('❌ Business search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search businesses'
      }
    });
  }
});

// Get business by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM businesses WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUSINESS_NOT_FOUND',
          message: 'Business not found'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Get business error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_BUSINESS_ERROR',
        message: 'Failed to get business details'
      }
    });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_businesses,
        COUNT(DISTINCT industry) as total_industries,
        COUNT(DISTINCT source) as total_sources,
        AVG(quality_score) as avg_quality_score,
        AVG((financial_data->>'asking_price')::numeric) as avg_asking_price,
        AVG((financial_data->>'annual_revenue')::numeric) as avg_annual_revenue
      FROM businesses
    `);

    const sourceBreakdown = await pool.query(`
      SELECT source, COUNT(*) as count
      FROM businesses
      GROUP BY source
      ORDER BY count DESC
    `);

    const industryBreakdown = await pool.query(`
      SELECT industry, COUNT(*) as count
      FROM businesses
      GROUP BY industry
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        by_source: sourceBreakdown.rows,
        by_industry: industryBreakdown.rows
      }
    });

  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: 'Failed to get statistics'
      }
    });
  }
});

export { router as realBusinessRoutes };