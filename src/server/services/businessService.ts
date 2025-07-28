import { pool, queries } from '../database';
import { BusinessListing, SearchQuery, SearchResults, RiskAssessment, ROIProjection } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class BusinessService {
  async search(query: SearchQuery, organizationId?: string): Promise<SearchResults> {
    let sqlQuery = `
      SELECT 
        bl.*,
        COUNT(bw.id) as watchlist_count,
        COUNT(ddr.id) as report_count
      FROM business_listings bl
      LEFT JOIN business_watchlist bw ON bl.id = bw.business_listing_id
      LEFT JOIN due_diligence_reports ddr ON bl.id = ddr.business_listing_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    // Add search filters
    if (query.keywords) {
      sqlQuery += ` AND (bl.name ILIKE $${paramCount} OR bl.industry ILIKE $${paramCount})`;
      params.push(`%${query.keywords}%`);
      paramCount++;
    }

    if (query.industry && query.industry.length > 0) {
      sqlQuery += ` AND bl.industry = ANY($${paramCount})`;
      params.push(query.industry);
      paramCount++;
    }

    if (query.location?.city) {
      sqlQuery += ` AND bl.location->>'city' ILIKE $${paramCount}`;
      params.push(`%${query.location.city}%`);
      paramCount++;
    }

    if (query.location?.state) {
      sqlQuery += ` AND bl.location->>'state' = $${paramCount}`;
      params.push(query.location.state);
      paramCount++;
    }

    // Financial filters
    if (query.financial_filters?.min_price) {
      sqlQuery += ` AND (bl.financial_data->>'asking_price')::numeric >= $${paramCount}`;
      params.push(query.financial_filters.min_price);
      paramCount++;
    }

    if (query.financial_filters?.max_price) {
      sqlQuery += ` AND (bl.financial_data->>'asking_price')::numeric <= $${paramCount}`;
      params.push(query.financial_filters.max_price);
      paramCount++;
    }

    if (query.financial_filters?.min_revenue) {
      sqlQuery += ` AND (bl.financial_data->>'annual_revenue')::numeric >= $${paramCount}`;
      params.push(query.financial_filters.min_revenue);
      paramCount++;
    }

    if (query.financial_filters?.max_revenue) {
      sqlQuery += ` AND (bl.financial_data->>'annual_revenue')::numeric <= $${paramCount}`;
      params.push(query.financial_filters.max_revenue);
      paramCount++;
    }

    if (query.financial_filters?.min_cash_flow) {
      sqlQuery += ` AND (bl.financial_data->>'cash_flow')::numeric >= $${paramCount}`;
      params.push(query.financial_filters.min_cash_flow);
      paramCount++;
    }

    if (query.financial_filters?.max_cash_flow) {
      sqlQuery += ` AND (bl.financial_data->>'cash_flow')::numeric <= $${paramCount}`;
      params.push(query.financial_filters.max_cash_flow);
      paramCount++;
    }

    // Group by and order
    sqlQuery += ' GROUP BY bl.id';

    // Sorting
    const sortField = query.sort_by || 'quality_score';
    const sortOrder = query.sort_order || 'desc';
    
    const sortMap = {
      'price': '(bl.financial_data->>\'asking_price\')::numeric',
      'revenue': '(bl.financial_data->>\'annual_revenue\')::numeric', 
      'cash_flow': '(bl.financial_data->>\'cash_flow\')::numeric',
      'quality_score': 'bl.quality_score',
      'created_at': 'bl.created_at'
    };

    sqlQuery += ` ORDER BY ${sortMap[sortField] || 'bl.quality_score'} ${sortOrder.toUpperCase()}`;

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    sqlQuery += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    // Execute query
    const result = await pool.query(sqlQuery, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT bl.id) as total
      FROM business_listings bl
      WHERE 1=1
    `;
    
    // Apply same filters for count (without the joins and group by)
    const countParams = [];
    let countParamCount = 1;

    if (query.keywords) {
      countQuery += ` AND (bl.name ILIKE $${countParamCount} OR bl.industry ILIKE $${countParamCount})`;
      countParams.push(`%${query.keywords}%`);
      countParamCount++;
    }

    if (query.industry && query.industry.length > 0) {
      countQuery += ` AND bl.industry = ANY($${countParamCount})`;
      countParams.push(query.industry);
      countParamCount++;
    }

    // Add other filters...
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);

    return {
      listings: result.rows.map(this.formatBusinessListing),
      total_count: totalCount,
      has_more: offset + limit < totalCount,
      tier_limited: false // This would be set based on subscription tier
    };
  }

  async getById(id: string, organizationId?: string): Promise<BusinessListing | null> {
    const result = await pool.query(`
      SELECT 
        bl.*,
        COUNT(bw.id) as watchlist_count,
        COUNT(ddr.id) as report_count
      FROM business_listings bl
      LEFT JOIN business_watchlist bw ON bl.id = bw.business_listing_id
      LEFT JOIN due_diligence_reports ddr ON bl.id = ddr.business_listing_id
      WHERE bl.id = $1
      GROUP BY bl.id
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.formatBusinessListing(result.rows[0]);
  }

  async addToWatchlist(userId: string, organizationId: string, businessId: string, notes?: string): Promise<void> {
    await pool.query(`
      INSERT INTO business_watchlist (id, user_id, organization_id, business_listing_id, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, business_listing_id) 
      DO UPDATE SET notes = EXCLUDED.notes, added_at = CURRENT_TIMESTAMP
    `, [uuidv4(), userId, organizationId, businessId, notes || '']);
  }

  async removeFromWatchlist(userId: string, businessId: string): Promise<void> {
    await pool.query(`
      DELETE FROM business_watchlist 
      WHERE user_id = $1 AND business_listing_id = $2
    `, [userId, businessId]);
  }

  async getWatchlist(userId: string, organizationId: string): Promise<BusinessListing[]> {
    const result = await pool.query(`
      SELECT 
        bl.*,
        bw.notes,
        bw.added_at as watchlist_added_at
      FROM business_watchlist bw
      JOIN business_listings bl ON bw.business_listing_id = bl.id
      WHERE bw.user_id = $1 AND bw.organization_id = $2
      ORDER BY bw.added_at DESC
    `, [userId, organizationId]);

    return result.rows.map(this.formatBusinessListing);
  }

  async generateDueDiligenceReport(
    businessId: string, 
    organizationId: string
  ): Promise<{
    riskAssessment: RiskAssessment;
    roiProjection: ROIProjection;
  }> {
    const business = await this.getById(businessId);
    if (!business) {
      throw new Error('Business listing not found');
    }

    // Generate risk assessment
    const riskAssessment = await this.calculateRiskAssessment(business);
    
    // Generate ROI projection
    const roiProjection = await this.calculateROIProjection(business, 500000); // Default investment

    // Store report
    await pool.query(`
      INSERT INTO due_diligence_reports (id, business_listing_id, organization_id, risk_assessment, roi_projection, sba_assessment)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      uuidv4(),
      businessId,
      organizationId,
      JSON.stringify(riskAssessment),
      JSON.stringify(roiProjection),
      JSON.stringify(riskAssessment.sba_qualification)
    ]);

    return { riskAssessment, roiProjection };
  }

  private async calculateRiskAssessment(business: BusinessListing): Promise<RiskAssessment> {
    // Financial Health Analysis
    const financialHealth = this.assessFinancialHealth(business);
    
    // Legal Risk (simplified - would integrate with legal databases)
    const legalRisk = this.assessLegalRisk(business);
    
    // Operational Risk
    const operationalRisk = this.assessOperationalRisk(business);
    
    // Market Risk
    const marketRisk = this.assessMarketRisk(business);

    // Composite risk score (0-100, lower is better)
    const compositeRiskScore = Math.round(
      (financialHealth * 0.4) +
      (legalRisk * 0.2) +
      (operationalRisk * 0.2) +
      (marketRisk * 0.2)
    );

    // Risk grade
    let riskGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (compositeRiskScore <= 20) riskGrade = 'A';
    else if (compositeRiskScore <= 40) riskGrade = 'B';
    else if (compositeRiskScore <= 60) riskGrade = 'C';
    else if (compositeRiskScore <= 80) riskGrade = 'D';
    else riskGrade = 'F';

    // SBA qualification assessment
    const sbaQualification = await this.assessSBAQualification(business);

    return {
      composite_risk_score: compositeRiskScore,
      risk_grade: riskGrade,
      risk_components: {
        financial_health: financialHealth,
        legal_risk: legalRisk,
        operational_risk: operationalRisk,
        market_risk: marketRisk
      },
      recommendations: this.generateRiskRecommendations(compositeRiskScore, riskGrade),
      sba_qualification: sbaQualification
    };
  }

  private assessFinancialHealth(business: BusinessListing): number {
    const financial = business.financial_data;
    let risk = 50; // Baseline

    // Revenue trends (would need historical data)
    if (financial.annual_revenue && financial.annual_revenue > 1000000) {
      risk -= 10;
    } else if (financial.annual_revenue && financial.annual_revenue < 250000) {
      risk += 15;
    }

    // Cash flow analysis
    if (financial.cash_flow && financial.annual_revenue) {
      const cashFlowMargin = financial.cash_flow / financial.annual_revenue;
      if (cashFlowMargin > 0.15) risk -= 15;
      else if (cashFlowMargin < 0.05) risk += 20;
    }

    // Business age
    if (financial.year_established) {
      const age = new Date().getFullYear() - financial.year_established;
      if (age > 10) risk -= 10;
      else if (age < 3) risk += 15;
    }

    return Math.max(0, Math.min(100, risk));
  }

  private assessLegalRisk(business: BusinessListing): number {
    // Simplified assessment - would integrate with legal databases
    let risk = 30; // Lower baseline for legal risk

    // Industry-specific legal risks
    const highRiskIndustries = ['cannabis', 'cryptocurrency', 'gambling', 'adult'];
    const mediumRiskIndustries = ['healthcare', 'finance', 'food service'];

    if (business.industry) {
      const industry = business.industry.toLowerCase();
      if (highRiskIndustries.some(h => industry.includes(h))) {
        risk += 30;
      } else if (mediumRiskIndustries.some(m => industry.includes(m))) {
        risk += 15;
      }
    }

    return Math.max(0, Math.min(100, risk));
  }

  private assessOperationalRisk(business: BusinessListing): number {
    let risk = 40; // Baseline operational risk

    // Location-based risks
    if (business.location?.state) {
      const businessFriendlyStates = ['TX', 'FL', 'NV', 'WY', 'DE'];
      const challengingStates = ['CA', 'NY', 'IL'];
      
      if (businessFriendlyStates.includes(business.location.state)) {
        risk -= 10;
      } else if (challengingStates.includes(business.location.state)) {
        risk += 10;
      }
    }

    // Data quality (affects operational assessment accuracy)
    if (business.quality_score < 50) {
      risk += 20;
    } else if (business.quality_score > 80) {
      risk -= 10;
    }

    return Math.max(0, Math.min(100, risk));
  }

  private assessMarketRisk(business: BusinessListing): number {
    let risk = 45; // Baseline market risk

    // Industry growth trends (would use external data)
    const growthIndustries = ['technology', 'healthcare', 'e-commerce', 'renewable'];
    const decliningIndustries = ['retail', 'print media', 'coal', 'traditional manufacturing'];

    if (business.industry) {
      const industry = business.industry.toLowerCase();
      if (growthIndustries.some(g => industry.includes(g))) {
        risk -= 15;
      } else if (decliningIndustries.some(d => industry.includes(d))) {
        risk += 20;
      }
    }

    return Math.max(0, Math.min(100, risk));
  }

  private generateRiskRecommendations(riskScore: number, grade: string): string[] {
    const recommendations = [];

    if (riskScore > 60) {
      recommendations.push('Consider additional due diligence before proceeding');
      recommendations.push('Negotiate lower asking price to compensate for higher risk');
      recommendations.push('Secure additional financing contingencies');
    }

    if (grade === 'A' || grade === 'B') {
      recommendations.push('Strong acquisition candidate with manageable risk profile');
      recommendations.push('Consider expediting due diligence to secure deal');
    }

    recommendations.push('Verify all financial statements with accountant review');
    recommendations.push('Conduct on-site operational assessment');
    recommendations.push('Review all contracts and legal obligations');

    return recommendations;
  }

  private async assessSBAQualification(business: BusinessListing): Promise<any> {
    // Simplified SBA qualification assessment
    const checks = {
      size_standard: this.checkSBASize(business),
      industry_eligibility: this.checkSBAIndustry(business),
      financial_health: business.financial_data.annual_revenue ? business.financial_data.annual_revenue > 50000 : false,
      // Would add more sophisticated checks
    };

    const qualificationScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

    return {
      qualified: qualificationScore >= 0.7,
      qualification_score: qualificationScore,
      detailed_checks: checks,
      max_loan_amount: this.calculateMaxSBALoan(business),
      recommendations: qualificationScore < 0.7 ? 
        ['Improve financial documentation', 'Consider alternative financing'] :
        ['Strong SBA loan candidate', 'Prepare comprehensive loan application']
    };
  }

  private checkSBASize(business: BusinessListing): boolean {
    // SBA size standards vary by industry - simplified check
    if (business.financial_data.annual_revenue) {
      return business.financial_data.annual_revenue <= 35000000; // $35M general limit
    }
    return true;
  }

  private checkSBAIndustry(business: BusinessListing): boolean {
    // Most industries are eligible - check for ineligible ones
    const ineligibleIndustries = ['gambling', 'adult entertainment', 'pyramid sales'];
    if (business.industry) {
      return !ineligibleIndustries.some(industry => 
        business.industry!.toLowerCase().includes(industry)
      );
    }
    return true;
  }

  private calculateMaxSBALoan(business: BusinessListing): number {
    if (!business.financial_data.asking_price) return 0;
    
    // SBA 7(a) loans up to $5M, typically 70-90% of project cost
    const maxLoanAmount = Math.min(5000000, business.financial_data.asking_price * 0.9);
    return maxLoanAmount;
  }

  private async calculateROIProjection(business: BusinessListing, investment: number): Promise<ROIProjection> {
    const financial = business.financial_data;
    
    if (!financial.cash_flow || !financial.annual_revenue) {
      return {
        projected_roi: 0,
        break_even_months: 0,
        risk_adjusted_return: 0,
        confidence_interval: { low: 0, high: 0 }
      };
    }

    // Simple ROI calculation
    const annualCashFlow = financial.cash_flow;
    const projectedROI = (annualCashFlow / investment) * 100;
    
    // Break-even calculation  
    const breakEvenMonths = investment / (annualCashFlow / 12);
    
    // Risk adjustment based on risk score
    const riskAdjustment = Math.max(0.5, 1 - (business.risk_score / 100));
    const riskAdjustedReturn = projectedROI * riskAdjustment;

    return {
      projected_roi: Math.round(projectedROI * 100) / 100,
      break_even_months: Math.round(breakEvenMonths),
      risk_adjusted_return: Math.round(riskAdjustedReturn * 100) / 100,
      confidence_interval: {
        low: Math.round((projectedROI * 0.7) * 100) / 100,
        high: Math.round((projectedROI * 1.3) * 100) / 100
      }
    };
  }

  private formatBusinessListing(row: any): BusinessListing {
    return {
      id: row.id,
      name: row.name,
      industry: row.industry,
      location: row.location || {},
      financial_data: row.financial_data || {},
      contact_info: row.contact_info || {},
      quality_score: row.quality_score,
      risk_score: row.risk_score,
      data_sources: row.data_sources || [],
      last_updated: row.last_updated,
      created_at: row.created_at
    };
  }

  // Export data with tier restrictions
  async exportSearchResults(
    query: SearchQuery,
    organizationId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    const results = await this.search(query, organizationId);
    
    if (format === 'json') {
      return JSON.stringify(results.listings, null, 2);
    }

    // CSV export
    const headers = [
      'Name', 'Industry', 'City', 'State', 'Asking Price', 
      'Annual Revenue', 'Cash Flow', 'Quality Score', 'Risk Score'
    ];

    const csvRows = [
      headers.join(','),
      ...results.listings.map(listing => [
        `"${listing.name}"`,
        `"${listing.industry || ''}"`,
        `"${listing.location?.city || ''}"`,
        `"${listing.location?.state || ''}"`,
        listing.financial_data?.asking_price || '',
        listing.financial_data?.annual_revenue || '',
        listing.financial_data?.cash_flow || '',
        listing.quality_score,
        listing.risk_score
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

export const businessService = new BusinessService();