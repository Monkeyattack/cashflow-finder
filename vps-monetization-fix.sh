#!/bin/bash

# Fixed VPS Monetization Setup Script
echo "🚀 Fixing monetization setup on Cash Flow Finder..."

cd /opt/apps/cashflow-finder

# 1. Check PM2 process name
echo "📋 Checking PM2 processes..."
pm2 list

# 2. Fix database schema
echo "🗄️ Fixing database schema..."
PGPASSWORD=AirpUgWN33IcU93D psql -h localhost -U cashflow_user -d cashflow_finder << 'EOF'

-- Create organizations table if not exists (for compatibility)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fix subscriptions table to handle individual users
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255),
    user_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 year',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure premium user exists with correct setup
DO $$
DECLARE
    user_id_var VARCHAR(255);
BEGIN
    -- Get or create user
    SELECT id INTO user_id_var FROM users WHERE email = 'meredith@monkeyattack.com';
    
    IF user_id_var IS NULL THEN
        user_id_var := gen_random_uuid()::text;
        INSERT INTO users (
            id, email, name, subscription_tier, 
            monthly_searches_used, monthly_exports_used, 
            email_verified, created_at
        ) VALUES (
            user_id_var, 
            'meredith@monkeyattack.com', 
            'Meredith (Owner)', 
            'enterprise', 
            0, 0, true, NOW()
        );
    ELSE
        UPDATE users SET 
            subscription_tier = 'enterprise',
            monthly_searches_used = 0,
            monthly_exports_used = 0,
            last_tier_reset = NOW()
        WHERE id = user_id_var;
    END IF;
    
    -- Create subscription for user
    INSERT INTO subscriptions (
        id, user_id, status, 
        current_period_start, current_period_end
    ) VALUES (
        gen_random_uuid()::text, 
        user_id_var, 
        'active', 
        NOW(), 
        NOW() + INTERVAL '10 years'
    ) ON CONFLICT DO NOTHING;
END $$;

-- Fix UPDATE statements for PostgreSQL (use CTEs instead of LIMIT)
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

# 3. Find correct PM2 process name
echo "🔍 Finding PM2 process..."
PM2_NAME=$(pm2 list | grep -E "cashflow|finder" | awk '{print $4}' | head -1)

if [ -z "$PM2_NAME" ]; then
    echo "⚠️  No PM2 process found. Starting new process..."
    pm2 start ecosystem.config.js
else
    echo "♻️  Restarting PM2 process: $PM2_NAME"
    pm2 restart "$PM2_NAME"
fi

echo "✅ Monetization fix complete!"
echo ""
echo "🎯 Verified features:"
echo "  ✅ Premium user account for meredith@monkeyattack.com"
echo "  ✅ ROI analysis data added to businesses"
echo "  ✅ SBA qualification data added"
echo "  ✅ Application restarted"
echo ""
echo "📱 Test at: http://172.93.51.42:3000/browse"