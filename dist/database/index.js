"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queries = exports.firestore = exports.pool = void 0;
exports.testConnections = testConnections;
exports.withTransaction = withTransaction;
const pg_1 = require("pg");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// PostgreSQL connection
exports.pool = new pg_1.Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'cashflow_finder',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Firebase Admin initialization
let firebaseApp;
try {
    // Try service account credentials first, fall back to Application Default Credentials
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('🔑 Using Firebase service account credentials');
        firebaseApp = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    else {
        console.log('🔑 Using Application Default Credentials (ADC)');
        firebaseApp = (0, app_1.initializeApp)({
            projectId: process.env.FIREBASE_PROJECT_ID || 'cashflow-finder-v2',
        });
    }
}
catch (error) {
    console.error('Firebase initialization error:', error);
    // Try ADC as fallback
    try {
        firebaseApp = (0, app_1.initializeApp)({
            projectId: process.env.FIREBASE_PROJECT_ID || 'cashflow-finder-v2',
        });
        console.log('✅ Firebase initialized with Application Default Credentials');
    }
    catch (adcError) {
        console.error('❌ Firebase ADC initialization failed:', adcError);
    }
}
exports.firestore = (0, firestore_1.getFirestore)(firebaseApp);
// Database connection test
async function testConnections() {
    try {
        // Test PostgreSQL
        const pgClient = await exports.pool.connect();
        await pgClient.query('SELECT NOW()');
        pgClient.release();
        console.log('✅ PostgreSQL connection successful');
        // Test Firestore
        const testDoc = await exports.firestore.collection('test').doc('connection').get();
        console.log('✅ Firestore connection successful');
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
// Utility function for transaction handling
async function withTransaction(callback) {
    const client = await exports.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
// Query builder utilities
exports.queries = {
    // Organization queries
    getOrganization: `
    SELECT * FROM organizations WHERE id = $1
  `,
    getOrganizationWithUsage: `
    SELECT 
      o.*,
      ous.monthly_searches,
      ous.monthly_exports,
      ous.monthly_api_calls
    FROM organizations o
    LEFT JOIN organization_usage_summary ous ON o.id = ous.organization_id
    WHERE o.id = $1
  `,
    // User queries
    getUserByEmail: `
    SELECT * FROM users WHERE email = $1
  `,
    getUserMemberships: `
    SELECT 
      m.*,
      o.name as organization_name,
      o.subscription_tier
    FROM memberships m
    JOIN organizations o ON m.organization_id = o.id
    WHERE m.user_id = $1 AND m.status = 'active'
  `,
    // Business listing queries
    searchBusinessListings: `
    SELECT * FROM business_listings_enriched
    WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR industry = $2)
      AND ($3::numeric IS NULL OR (financial_data->>'asking_price')::numeric >= $3)
      AND ($4::numeric IS NULL OR (financial_data->>'asking_price')::numeric <= $4)
    ORDER BY quality_score DESC
    LIMIT $5 OFFSET $6
  `,
    // Usage tracking
    recordUsage: `
    INSERT INTO usage_records (id, organization_id, action_type, quantity)
    VALUES ($1, $2, $3, $4)
  `,
    getCurrentUsage: `
    SELECT 
      action_type,
      SUM(quantity) as total_usage
    FROM usage_records
    WHERE organization_id = $1 
      AND recorded_at >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY action_type
  `,
    // Analytics
    recordAnalyticsEvent: `
    INSERT INTO analytics_events (id, user_id, organization_id, event_type, properties, session_id)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
};
const dbExports = { pool: exports.pool, firestore: exports.firestore, testConnections, withTransaction, queries: exports.queries };
exports.default = dbExports;
