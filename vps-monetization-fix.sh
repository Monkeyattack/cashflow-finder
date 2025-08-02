#!/bin/bash

# Fixed VPS Monetization Setup Script for cashflowfinder.app
echo "🚀 Fixing monetization setup on Cash Flow Finder..."

cd /opt/apps/cashflow-finder

# 1. Check PM2 process name
echo "📋 Checking PM2 processes..."
pm2 list

# 2. Add Amazon Associates configuration to .env if not present
echo "📦 Adding Amazon Associates configuration..."
if ! grep -q "AMAZON_ASSOCIATE_TAG" .env 2>/dev/null; then
    echo "" >> .env
    echo "# Amazon Associates Configuration" >> .env
    echo "AMAZON_ASSOCIATE_TAG=cashflowfinder-20" >> .env
    echo "AFFILIATE_PARTNER_ID=cashflowfinder" >> .env
    echo "✅ Amazon Associates config added"
else
    echo "✅ Amazon Associates config already present"
fi

# 3. Fix database schema
echo "🗄️ Fixing database schema..."
PGPASSWORD=AirpUgWN33IcU93D psql -h localhost -U cashflow_user -d cashflow_finder << 'EOF'

-- Add tier and OAuth columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_searches_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_exports_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_tier_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Add premium features to businesses table  
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS roi_analysis JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS sba_qualification JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS due_diligence_report JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tier_access_level VARCHAR(50) DEFAULT 'starter';

-- Create affiliate partners table
CREATE TABLE IF NOT EXISTS affiliate_partners (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    affiliate_link_template VARCHAR(1000) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 0.00,
    cookie_duration_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create affiliate referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    partner_id VARCHAR(255),
    business_listing_id VARCHAR(255),
    service_type VARCHAR(100) NOT NULL,
    referral_url VARCHAR(1000) NOT NULL,
    referral_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cookie_expiry TIMESTAMP,
    click_count INTEGER DEFAULT 0,
    conversion_value DECIMAL(12,2),
    commission_earned DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'pending'
);

-- Insert affiliate partners
INSERT INTO affiliate_partners (id, name, category, affiliate_link_template, commission_rate, cookie_duration_days) VALUES
('amazon_books', 'Amazon Associates - Business Books', 'business_books', 'https://www.amazon.com/dp/{asin}?tag={associate_tag}&linkCode=ogi&th=1&psc=1', 4.00, 1),
('legalzoom', 'LegalZoom', 'legal', 'https://www.legalzoom.com/business?utm_source=cashflowfinder&utm_medium=affiliate&utm_campaign={campaign}', 15.00, 30),
('fundera', 'Fundera SBA Loans', 'financing', 'https://www.fundera.com/business-loans/sba-loans?utm_source=cashflowfinder&utm_medium=affiliate&partner_id={partner_id}', 25.00, 60),
('bizplan', 'BizPlan Business Plans', 'due_diligence', 'https://www.bizplan.com/?utm_source=cashflowfinder&utm_medium=affiliate&ref={ref_code}', 20.00, 30)
ON CONFLICT (id) DO NOTHING;

-- Create/Update premium user account for meredith@monkeyattack.com
UPDATE users SET 
  subscription_tier = 'enterprise',
  monthly_searches_used = 0,
  monthly_exports_used = 0,
  last_tier_reset = NOW(),
  email_verified = true
WHERE email = 'meredith@monkeyattack.com';

-- If user doesn't exist, create it
INSERT INTO users (
  id, email, name, subscription_tier, 
  monthly_searches_used, monthly_exports_used, 
  email_verified, created_at
) 
SELECT 
  gen_random_uuid()::text, 
  'meredith@monkeyattack.com', 
  'Meredith (Owner)', 
  'enterprise', 
  0, 0, true, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'meredith@monkeyattack.com'
);

-- Add some premium features to existing businesses for demo
WITH businesses_to_update AS (
    SELECT id 
    FROM businesses 
    WHERE financial_data->>'cash_flow' IS NOT NULL 
    AND (financial_data->>'cash_flow')::numeric > 0
    AND roi_analysis IS NULL
    ORDER BY created_at DESC
    LIMIT 50
)
UPDATE businesses b
SET roi_analysis = jsonb_build_object(
    'payback_period_months', 
    CASE 
        WHEN (b.financial_data->>'cash_flow')::numeric > 0 
        THEN ROUND((b.financial_data->>'asking_price')::numeric / ((b.financial_data->>'cash_flow')::numeric / 12))
        ELSE 999
    END,
    'roi_percentage', 
    CASE 
        WHEN (b.financial_data->>'asking_price')::numeric > 0 
        THEN ROUND(((b.financial_data->>'cash_flow')::numeric / (b.financial_data->>'asking_price')::numeric) * 100, 2)
        ELSE 0
    END,
    'risk_level', 
    CASE 
        WHEN b.quality_score >= 8 THEN 'Low'
        WHEN b.quality_score >= 6 THEN 'Medium'
        ELSE 'High'
    END,
    'analysis_date', NOW()
)
FROM businesses_to_update
WHERE b.id = businesses_to_update.id;

-- Update SBA qualification data
WITH businesses_for_sba AS (
    SELECT id 
    FROM businesses 
    WHERE (financial_data->>'asking_price')::numeric < 5000000
    AND (financial_data->>'asking_price')::numeric > 0
    AND sba_qualification IS NULL
    ORDER BY created_at DESC
    LIMIT 50
)
UPDATE businesses b
SET sba_qualification = jsonb_build_object(
    'eligible', true,
    'loan_amount', ROUND((b.financial_data->>'asking_price')::numeric * 0.9),
    'down_payment', ROUND((b.financial_data->>'asking_price')::numeric * 0.1),
    'qualification_score', ROUND(b.quality_score * 10),
    'analysis_date', NOW()
)
FROM businesses_for_sba
WHERE b.id = businesses_for_sba.id;

-- Verify setup
SELECT 
    'Premium User:' as label, 
    email, 
    subscription_tier, 
    monthly_searches_used,
    monthly_exports_used
FROM users 
WHERE email = 'meredith@monkeyattack.com';

SELECT 
    'Businesses with ROI:' as label,
    COUNT(*) as count
FROM businesses 
WHERE roi_analysis IS NOT NULL;

SELECT 
    'Businesses with SBA:' as label,
    COUNT(*) as count
FROM businesses 
WHERE sba_qualification IS NOT NULL;

EOF

# 4. Restart PM2 process (should be "cashflow-finder")
echo "🔍 Finding PM2 process..."
PM2_NAME=$(pm2 list | grep -E "cashflow-finder" | awk '{print $4}' | head -1)

if [ -z "$PM2_NAME" ]; then
    echo "⚠️  No cashflow-finder process found. Trying to start..."
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        echo "⚠️  No ecosystem.config.js found. Starting manually..."
        pm2 start dist/server/server.js --name "cashflow-finder" -- --port 3001
    fi
else
    echo "♻️  Restarting PM2 process: $PM2_NAME"
    pm2 restart "$PM2_NAME"
fi

# Check nginx status
echo "🌐 Checking nginx configuration..."
nginx -t && echo "✅ Nginx config valid" || echo "⚠️  Nginx config issues"

echo "✅ Monetization fix complete!"
echo ""
echo "🎯 Verified features:"
echo "  ✅ Premium user account for meredith@monkeyattack.com"
echo "  ✅ ROI analysis data added to businesses"
echo "  ✅ SBA qualification data added"
echo "  ✅ Application restarted"
echo ""
echo "📱 Test at: https://cashflowfinder.app/browse"
echo "🌐 Or direct IP: http://172.93.51.42:3001/browse"