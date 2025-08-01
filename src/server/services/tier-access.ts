import { pool } from '../database/index';

export interface TierLimits {
  monthly_searches: number;
  monthly_exports: number;
  data_history_days: number;
  advanced_filters: boolean;
  roi_analysis: boolean;
  sba_qualification: boolean;
  due_diligence_reports: boolean;
  full_contact_info: boolean;
  api_access: boolean;
  bulk_operations: boolean;
  custom_integrations: boolean;
  white_label: boolean;
}

export const SUBSCRIPTION_TIERS: Record<string, TierLimits> = {
  starter: {
    monthly_searches: 100,
    monthly_exports: 5,
    data_history_days: 30,
    advanced_filters: false,
    roi_analysis: false,
    sba_qualification: false,
    due_diligence_reports: false,
    full_contact_info: false,
    api_access: false,
    bulk_operations: false,
    custom_integrations: false,
    white_label: false
  },
  professional: {
    monthly_searches: 500,
    monthly_exports: 25,
    data_history_days: 365,
    advanced_filters: true,
    roi_analysis: true,
    sba_qualification: true,
    due_diligence_reports: true,
    full_contact_info: true,
    api_access: false,
    bulk_operations: false,
    custom_integrations: false,
    white_label: false
  },
  enterprise: {
    monthly_searches: -1, // unlimited
    monthly_exports: -1, // unlimited
    data_history_days: -1, // unlimited
    advanced_filters: true,
    roi_analysis: true,
    sba_qualification: true,
    due_diligence_reports: true,
    full_contact_info: true,
    api_access: true,
    bulk_operations: true,
    custom_integrations: true,
    white_label: true
  }
};

export interface FilteredBusinessData {
  id: string;
  name: string;
  industry: string;
  location: any;
  financial_data: any;
  contact_info?: any;
  quality_score: number;
  risk_score?: number;
  roi_analysis?: any;
  sba_qualification?: any;
  due_diligence_report?: any;
  created_at: string;
  tier_access_level: string;
}

export class TierAccessService {
  static async checkUserAccess(userId: string, action: 'search' | 'export'): Promise<{ allowed: boolean; tier: string; usage: any }> {
    const client = await pool.connect();
    
    try {
      // Get user's current tier and usage
      const userResult = await client.query(
        'SELECT subscription_tier, monthly_searches_used, monthly_exports_used, last_tier_reset FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return { allowed: false, tier: 'none', usage: null };
      }
      
      const user = userResult.rows[0];
      const tier = user.subscription_tier;
      const limits = SUBSCRIPTION_TIERS[tier];
      
      // Check if we need to reset monthly counters
      const now = new Date();
      const lastReset = new Date(user.last_tier_reset);
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 30) {
        await client.query(
          'UPDATE users SET monthly_searches_used = 0, monthly_exports_used = 0, last_tier_reset = NOW() WHERE id = $1',
          [userId]
        );
        user.monthly_searches_used = 0;
        user.monthly_exports_used = 0;
      }
      
      // Check limits
      let allowed = true;
      let currentUsage = 0;
      let limit = 0;
      
      if (action === 'search') {
        currentUsage = user.monthly_searches_used;
        limit = limits.monthly_searches;
        allowed = limit === -1 || currentUsage < limit;
      } else if (action === 'export') {
        currentUsage = user.monthly_exports_used;
        limit = limits.monthly_exports;
        allowed = limit === -1 || currentUsage < limit;
      }
      
      return {
        allowed,
        tier,
        usage: {
          searches_used: user.monthly_searches_used,
          searches_limit: limits.monthly_searches,
          exports_used: user.monthly_exports_used,
          exports_limit: limits.monthly_exports
        }
      };
    } finally {
      client.release();
    }
  }
  
  static async incrementUsage(userId: string, action: 'search' | 'export'): Promise<void> {
    const client = await pool.connect();
    
    try {
      const column = action === 'search' ? 'monthly_searches_used' : 'monthly_exports_used';
      await client.query(
        `UPDATE users SET ${column} = ${column} + 1 WHERE id = $1`,
        [userId]
      );
    } finally {
      client.release();
    }
  }
  
  static async filterBusinessDataByTier(userId: string, businessData: any[]): Promise<FilteredBusinessData[]> {
    const client = await pool.connect();
    
    try {
      const userResult = await client.query(
        'SELECT subscription_tier FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return [];
      }
      
      const tier = userResult.rows[0].subscription_tier;
      const limits = SUBSCRIPTION_TIERS[tier];
      
      return businessData.map(business => {
        const filtered: FilteredBusinessData = {
          id: business.id,
          name: business.name,
          industry: business.industry,
          location: business.location,
          financial_data: this.filterFinancialData(business.financial_data, tier),
          quality_score: business.quality_score,
          created_at: business.created_at,
          tier_access_level: business.tier_access_level || 'starter'
        };
        
        // Add tier-restricted data
        if (limits.full_contact_info) {
          filtered.contact_info = business.contact_info;
        }
        
        if (limits.roi_analysis && business.roi_analysis) {
          filtered.roi_analysis = business.roi_analysis;
        }
        
        if (limits.sba_qualification && business.sba_qualification) {
          filtered.sba_qualification = business.sba_qualification;
        }
        
        if (limits.due_diligence_reports && business.due_diligence_report) {
          filtered.due_diligence_report = business.due_diligence_report;
        }
        
        if (tier === 'professional' || tier === 'enterprise') {
          filtered.risk_score = business.risk_score;
        }
        
        return filtered;
      });
    } finally {
      client.release();
    }
  }
  
  private static filterFinancialData(financialData: any, tier: string): any {
    if (!financialData) return financialData;
    
    if (tier === 'starter') {
      // Starter tier gets basic financial info only
      return {
        asking_price: financialData.asking_price,
        price_range: this.getPriceRange(financialData.asking_price)
      };
    }
    
    // Professional and Enterprise get full financial data
    return financialData;
  }
  
  private static getPriceRange(price: number): string {
    if (price < 50000) return 'Under $50K';
    if (price < 100000) return '$50K - $100K';
    if (price < 250000) return '$100K - $250K';
    if (price < 500000) return '$250K - $500K';
    if (price < 1000000) return '$500K - $1M';
    return 'Over $1M';
  }
  
  static async getAffiliateRecommendations(userId: string, businessId: string, category: string): Promise<any[]> {
    const client = await pool.connect();
    
    try {
      // Get active affiliate partners for the category
      const partnersResult = await client.query(
        'SELECT * FROM affiliate_partners WHERE category = $1 AND is_active = true ORDER BY commission_rate DESC',
        [category]
      );
      
      // Track the referral
      for (const partner of partnersResult.rows) {
        const referralId = require('uuid').v4();
        const referralUrl = this.generateAffiliateURL(partner, businessId);
        
        await client.query(
          `INSERT INTO affiliate_referrals (
            id, user_id, partner_id, business_listing_id, 
            service_type, referral_url, cookie_expiry
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '${partner.cookie_duration_days} days')`,
          [referralId, userId, partner.id, businessId, category, referralUrl]
        );
      }
      
      return partnersResult.rows.map(partner => ({
        id: partner.id,
        name: partner.name,
        category: partner.category,
        description: this.getPartnerDescription(partner.id),
        affiliate_url: this.generateAffiliateURL(partner, businessId),
        commission_rate: partner.commission_rate
      }));
    } finally {
      client.release();
    }
  }
  
  private static generateAffiliateURL(partner: any, businessId: string): string {
    let url = partner.affiliate_link_template;
    
    // Replace template variables
    url = url.replace('{associate_tag}', process.env.AMAZON_ASSOCIATE_TAG || 'cashflowfinder-20');
    url = url.replace('{partner_id}', process.env.AFFILIATE_PARTNER_ID || 'cashflowfinder');
    url = url.replace('{campaign}', `business-${businessId}`);
    url = url.replace('{ref_code}', 'cashflowfinder');
    
    return url;
  }
  
  private static getPartnerDescription(partnerId: string): string {
    const descriptions: Record<string, string> = {
      'amazon_books': 'Essential business acquisition and due diligence books to guide your purchase decision',
      'legalzoom': 'Legal services for business acquisitions, contracts, and entity formation',
      'fundera': 'SBA loans and business financing for your acquisition',
      'bizplan': 'Professional business plan creation and due diligence reports'
    };
    
    return descriptions[partnerId] || 'Professional services for business acquisition';
  }
}

export default TierAccessService;