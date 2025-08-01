-- Cash Flow Finder Database Schema
-- Multi-tenant SaaS platform for business listings

-- Core Organization Management
CREATE TABLE organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Management with Multi-Tenancy and OAuth
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE,
    linkedin_id VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    stripe_customer_id VARCHAR(255),
    monthly_searches_used INTEGER DEFAULT 0,
    monthly_exports_used INTEGER DEFAULT 0,
    last_tier_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, organization_id)
);

-- Business Listings with Quality Scoring and Tier Access
CREATE TABLE business_listings (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location JSONB,
    financial_data JSONB,
    contact_info JSONB,
    quality_score INTEGER DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    roi_analysis JSONB,
    sba_qualification JSONB,
    due_diligence_report JSONB,
    data_sources TEXT[],
    tier_access_level VARCHAR(50) DEFAULT 'starter' CHECK (tier_access_level IN ('starter', 'professional', 'enterprise')),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription and Usage Tracking
CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_records (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('search', 'export', 'api_call')),
    quantity INTEGER DEFAULT 1,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate Partners Configuration
CREATE TABLE affiliate_partners (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('financing', 'legal', 'insurance', 'due_diligence', 'business_books', 'training')),
    affiliate_link_template VARCHAR(1000) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    cookie_duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Amazon Associates Configuration
INSERT INTO affiliate_partners (id, name, category, affiliate_link_template, commission_rate, cookie_duration_days) VALUES
('amazon_books', 'Amazon Associates - Business Books', 'business_books', 'https://www.amazon.com/dp/{asin}?tag={associate_tag}&linkCode=ogi&th=1&psc=1', 4.00, 1),
('legalzoom', 'LegalZoom', 'legal', 'https://www.legalzoom.com/business?utm_source=cashflowfinder&utm_medium=affiliate&utm_campaign={campaign}', 15.00, 30),
('fundera', 'Fundera SBA Loans', 'financing', 'https://www.fundera.com/business-loans/sba-loans?utm_source=cashflowfinder&utm_medium=affiliate&partner_id={partner_id}', 25.00, 60),
('bizplan', 'BizPlan Business Plans', 'due_diligence', 'https://www.bizplan.com/?utm_source=cashflowfinder&utm_medium=affiliate&ref={ref_code}', 20.00, 30);

-- Affiliate Tracking System
CREATE TABLE affiliate_referrals (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    partner_id VARCHAR(255) REFERENCES affiliate_partners(id) ON DELETE CASCADE,
    business_listing_id VARCHAR(255) REFERENCES business_listings(id),
    service_type VARCHAR(100) NOT NULL,
    referral_url VARCHAR(1000) NOT NULL,
    referral_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cookie_expiry TIMESTAMP,
    click_count INTEGER DEFAULT 0,
    conversion_value DECIMAL(12,2),
    commission_earned DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'clicked', 'converted', 'expired'))
);

-- Analytics and Event Tracking
CREATE TABLE analytics_events (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Campaign Tracking
CREATE TABLE email_campaigns (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    campaign_type VARCHAR(100) NOT NULL,
    subject VARCHAR(500),
    template_name VARCHAR(255),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

-- Saved Searches
CREATE TABLE saved_searches (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    alert_frequency VARCHAR(50) DEFAULT 'none' CHECK (alert_frequency IN ('none', 'daily', 'weekly', 'monthly')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business Watchlist
CREATE TABLE business_watchlist (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    business_listing_id VARCHAR(255) REFERENCES business_listings(id) ON DELETE CASCADE,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, business_listing_id)
);

-- Due Diligence Reports
CREATE TABLE due_diligence_reports (
    id VARCHAR(255) PRIMARY KEY,
    business_listing_id VARCHAR(255) REFERENCES business_listings(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    risk_assessment JSONB,
    roi_projection JSONB,
    sba_assessment JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Attribution
CREATE TABLE revenue_attribution (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    organization_id VARCHAR(255) REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id VARCHAR(255) REFERENCES subscriptions(id) ON DELETE CASCADE,
    revenue_amount DECIMAL(12,2) NOT NULL,
    attribution_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_organizations_subscription_tier ON organizations(subscription_tier);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_memberships_user_org ON memberships(user_id, organization_id);
CREATE INDEX idx_business_listings_industry ON business_listings(industry);
CREATE INDEX idx_business_listings_quality ON business_listings(quality_score DESC);
CREATE INDEX idx_business_listings_location ON business_listings USING GIN (location);
CREATE INDEX idx_usage_records_org_date ON usage_records(organization_id, recorded_at DESC);
CREATE INDEX idx_analytics_events_org_date ON analytics_events(organization_id, timestamp DESC);
CREATE INDEX idx_business_listings_financial ON business_listings USING GIN (financial_data);

-- Views for Common Queries
CREATE VIEW organization_usage_summary AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.subscription_tier,
    COUNT(CASE WHEN ur.action_type = 'search' AND ur.recorded_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as monthly_searches,
    COUNT(CASE WHEN ur.action_type = 'export' AND ur.recorded_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as monthly_exports,
    COUNT(CASE WHEN ur.action_type = 'api_call' AND ur.recorded_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as monthly_api_calls
FROM organizations o
LEFT JOIN usage_records ur ON o.id = ur.organization_id
GROUP BY o.id, o.name, o.subscription_tier;

CREATE VIEW business_listings_enriched AS
SELECT 
    bl.*,
    COUNT(bw.id) as watchlist_count,
    COUNT(ddr.id) as report_count
FROM business_listings bl
LEFT JOIN business_watchlist bw ON bl.id = bw.business_listing_id
LEFT JOIN due_diligence_reports ddr ON bl.id = ddr.business_listing_id
GROUP BY bl.id;

-- Functions
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_business_listings_last_updated
    BEFORE UPDATE ON business_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();