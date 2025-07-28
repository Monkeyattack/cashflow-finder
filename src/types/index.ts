// Core Types for Cash Flow Finder SaaS Platform

export interface User {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
  created_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: Record<string, any>;
  created_at: Date;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending' | 'inactive';
  created_at: Date;
}

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';

export interface SubscriptionLimits {
  searches: number;
  exports: number;
  api_calls: number;
  historical_data_months: number;
  premium_analytics: boolean;
  api_access: boolean;
}

export interface BusinessListing {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  financial_data: {
    asking_price?: number;
    annual_revenue?: number;
    cash_flow?: number;
    ebitda?: number;
    year_established?: number;
  };
  contact_info: {
    broker_name?: string;
    broker_email?: string;
    broker_phone?: string;
    listing_url?: string;
  };
  quality_score: number;
  risk_score: number;
  data_sources: string[];
  last_updated: Date;
  created_at: Date;
}

export interface SearchQuery {
  keywords?: string;
  industry?: string[];
  location?: {
    city?: string;
    state?: string;
    radius?: number;
  };
  financial_filters?: {
    min_price?: number;
    max_price?: number;
    min_revenue?: number;
    max_revenue?: number;
    min_cash_flow?: number;
    max_cash_flow?: number;
  };
  sort_by?: 'price' | 'revenue' | 'cash_flow' | 'quality_score' | 'created_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  listings: BusinessListing[];
  total_count: number;
  has_more: boolean;
  tier_limited: boolean;
}

export interface UsageRecord {
  id: string;
  organization_id: string;
  action_type: 'search' | 'export' | 'api_call';
  quantity: number;
  recorded_at: Date;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_subscription_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  subscriptionTier: SubscriptionTier;
  permissions: string[];
  featureAccess: {
    canExport: boolean;
    canAccessAPI: boolean;
    canViewPremiumAnalytics: boolean;
    canAccessDueDiligence: boolean;
  } | {
    feature: string;
    usage: number;
    remaining: number;
  };
}

export interface RiskAssessment {
  composite_risk_score: number;
  risk_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  risk_components: {
    financial_health: number;
    legal_risk: number;
    operational_risk: number;
    market_risk: number;
  };
  recommendations: string[];
  sba_qualification: SBAAssessment;
}

export interface SBAAssessment {
  qualified: boolean;
  qualification_score: number;
  detailed_checks: {
    size_standard: boolean;
    ownership_citizenship: boolean;
    credit_requirements: boolean;
    financial_health: boolean;
    industry_eligibility: boolean;
  };
  max_loan_amount: number;
  recommendations: string[];
}

export interface ROIProjection {
  projected_roi: number;
  break_even_months: number;
  risk_adjusted_return: number;
  confidence_interval: {
    low: number;
    high: number;
  };
}

export interface AffiliateReferral {
  id: string;
  user_id: string;
  partner_id: string;
  service_type: string;
  referral_timestamp: Date;
  cookie_expiry: Date;
  conversion_value?: number;
  commission_earned?: number;
  status: 'pending' | 'converted' | 'expired';
}

export interface EmailCampaign {
  trigger: string;
  subject: string;
  template: string;
  personalizations: string[];
}

export interface AnalyticsEvent {
  event_type: string;
  properties: Record<string, any>;
  timestamp?: Date;
}

export interface DashboardMetrics {
  summary: {
    mrr: number;
    growth_rate: number;
    churn_rate: number;
    ltv_cac_ratio: number;
  };
  user_metrics: any;
  revenue_metrics: any;
  product_metrics: any;
  conversion_funnel: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  remaining_usage?: number;
}

// Form types for frontend
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  organization_name: string;
}

export interface SearchForm {
  keywords: string;
  industry: string;
  location: string;
  min_price: string;
  max_price: string;
  min_revenue: string;
  max_revenue: string;
}