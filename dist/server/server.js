"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_1 = require("./database/index");
const auth_1 = require("./routes/auth");
const auth_oauth_1 = __importDefault(require("./routes/auth-oauth"));
const business_1 = require("./routes/business");
const subscription_1 = require("./routes/subscription");
const analytics_1 = require("./routes/analytics");
const webhooks_1 = require("./routes/webhooks");
const test_1 = require("./routes/test");
const admin_1 = require("./routes/admin");
const real_business_1 = require("./routes/real-business");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.'
        }
    }
});
app.use('/api', limiter);
// Static file serving
app.use(express_1.default.static('.', { extensions: ['html'] }));
// Body parsing middleware
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' })); // Raw for Stripe webhooks
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbConnected = await (0, index_1.testConnections)();
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbConnected ? 'connected' : 'disconnected',
            version: process.env.npm_package_version || '1.0.0'
        }
    });
});
// Mock business data endpoint for testing
app.get('/api/business/mock-search', (req, res) => {
    const mockBusinesses = [
        {
            id: 'biz-001',
            name: 'Downtown Coffee Roasters',
            industry: 'Food & Beverage',
            location: { city: 'Seattle', state: 'WA', zip: '98101' },
            financial_data: {
                asking_price: 450000,
                annual_revenue: 680000,
                cash_flow: 125000,
                established_year: 2018
            },
            description: 'Successful coffee roasting business with loyal customer base',
            quality_score: 8.5,
            created_at: new Date('2024-01-15')
        },
        {
            id: 'biz-002',
            name: 'TechFix Computer Repair',
            industry: 'Technology',
            location: { city: 'Austin', state: 'TX', zip: '78701' },
            financial_data: {
                asking_price: 285000,
                annual_revenue: 420000,
                cash_flow: 98000,
                established_year: 2020
            },
            description: 'Computer repair shop with online presence and corporate contracts',
            quality_score: 7.8,
            created_at: new Date('2024-02-20')
        },
        {
            id: 'biz-003',
            name: 'Elite Cleaning Services',
            industry: 'Professional Services',
            location: { city: 'Miami', state: 'FL', zip: '33101' },
            financial_data: {
                asking_price: 750000,
                annual_revenue: 950000,
                cash_flow: 185000,
                established_year: 2015
            },
            description: 'Commercial cleaning company with recurring contracts',
            quality_score: 9.2,
            created_at: new Date('2024-03-10')
        }
    ];
    // Apply filters from query params
    let filtered = mockBusinesses;
    if (req.query.keywords) {
        const keywords = req.query.keywords.toString().toLowerCase();
        filtered = filtered.filter(b => b.name.toLowerCase().includes(keywords) ||
            b.industry.toLowerCase().includes(keywords));
    }
    if (req.query.industry) {
        filtered = filtered.filter(b => b.industry === req.query.industry);
    }
    if (req.query.min_price) {
        const minPrice = parseInt(req.query.min_price.toString());
        filtered = filtered.filter(b => b.financial_data.asking_price >= minPrice);
    }
    if (req.query.max_price) {
        const maxPrice = parseInt(req.query.max_price.toString());
        filtered = filtered.filter(b => b.financial_data.asking_price <= maxPrice);
    }
    if (req.query.min_revenue) {
        const minRevenue = parseInt(req.query.min_revenue.toString());
        filtered = filtered.filter(b => b.financial_data.annual_revenue >= minRevenue);
    }
    if (req.query.location) {
        const location = req.query.location.toString().toLowerCase();
        filtered = filtered.filter(b => b.location.city.toLowerCase().includes(location) ||
            b.location.state.toLowerCase().includes(location));
    }
    res.json({
        success: true,
        data: {
            listings: filtered,
            total_count: filtered.length,
            has_more: false
        }
    });
});
// Real email endpoint using SendGrid
app.post('/api/send-email', async (req, res) => {
    const { to, subject, message, html } = req.body;
    if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'EMAIL_NOT_CONFIGURED',
                message: 'SendGrid API key not configured'
            }
        });
    }
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
            to: to,
            from: process.env.FROM_EMAIL || 'noreply@cashflowfinder.com',
            subject: subject,
            text: message,
            html: html || message.replace(/\n/g, '<br>')
        };
        const result = await sgMail.send(msg);
        console.log('📧 Email sent successfully via SendGrid');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        res.json({
            success: true,
            data: {
                message: 'Email sent successfully',
                email_id: result[0].headers['x-message-id']
            }
        });
    }
    catch (error) {
        console.error('SendGrid error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'EMAIL_SEND_FAILED',
                message: error.message || 'Failed to send email'
            }
        });
    }
});
// Homepage route
app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cash Flow Finder - Business Listings</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="alternate icon" href="/favicon.ico">
    <link rel="apple-touch-icon" href="/favicon.svg">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .header h1 { color: #2563eb; font-size: 2.5rem; margin-bottom: 10px; }
        .filters { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .filter-row { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
        .filter-group { flex: 1; min-width: 200px; }
        .filter-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
        .filter-group input, .filter-group select { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 4px; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
        .btn:hover { background: #1d4ed8; }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
        .businesses { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .business-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .business-card h3 { color: #1f2937; margin-bottom: 10px; }
        .business-info { margin-bottom: 15px; }
        .business-info span { display: inline-block; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; margin-right: 8px; margin-bottom: 4px; font-size: 0.875rem; }
        .email-section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 20px; }
        .hidden { display: none; }
        #results { margin-top: 20px; }
        .loading { text-align: center; padding: 40px; color: #6b7280; }
        .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 15px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 10px;">
                <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="15" fill="#4a9960"/>
                    <circle cx="16" cy="16" r="12" fill="white"/>
                    <rect x="22.5" y="22.5" width="2" height="6" rx="1" fill="#4a9960" transform="rotate(45 23.5 25.5)"/>
                    <rect x="9" y="19" width="2" height="5" rx="0.5" fill="#4a9960"/>
                    <rect x="12" y="16" width="2" height="8" rx="0.5" fill="#4a9960"/>
                    <rect x="15" y="13" width="2" height="11" rx="0.5" fill="#4a9960"/>
                    <path d="M11 15 L17 9 M17 9 L15 9 M17 9 L17 11" stroke="#4a9960" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h1 style="color: #2563eb; font-size: 2.5rem; margin: 0;">Cash Flow Finder</h1>
            </div>
            <p>Discover profitable business opportunities with real financial data</p>
        </div>

        <div class="filters">
            <h3>🔍 Search & Filter Businesses</h3>
            <div class="filter-row">
                <div class="filter-group">
                    <label>Keywords</label>
                    <input type="text" id="keywords" placeholder="e.g. coffee, restaurant, tech">
                </div>
                <div class="filter-group">
                    <label>Industry</label>
                    <select id="industry">
                        <option value="">All Industries</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Technology">Technology</option>
                        <option value="Professional Services">Professional Services</option>
                        <option value="Health & Fitness">Health & Fitness</option>
                        <option value="Home Services">Home Services</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Location</label>
                    <input type="text" id="location" placeholder="City, State">
                </div>
            </div>
            <div class="filter-row">
                <button class="btn" id="browseBtn">🔍 Browse Businesses</button>
                <button class="btn btn-secondary" id="emailBtn">📧 Get Email Updates</button>
                <button class="btn btn-secondary" id="testBtn">🔧 Test API</button>
            </div>
        </div>

        <div id="results"></div>

        <div id="emailSection" class="email-section hidden">
            <h3>📧 Get Business Alerts</h3>
            <p>Enter your email to receive notifications about new business opportunities.</p>
            <div class="filter-row">
                <div class="filter-group">
                    <label>Email Address</label>
                    <input type="email" id="email" placeholder="your@email.com">
                </div>
                <div class="filter-group">
                    <label>Alert Frequency</label>
                    <select id="frequency">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>
            <button class="btn" id="subscribeBtn">🔔 Subscribe to Alerts</button>
        </div>
    </div>

    <script src="/homepage.js"></script>
</body>
</html>`);
});
// API Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/auth/oauth', auth_oauth_1.default);
app.use('/api/business', business_1.businessRoutes);
app.use('/api/real-business', real_business_1.realBusinessRoutes);
app.use('/api/subscription', subscription_1.subscriptionRoutes);
app.use('/api/analytics', analytics_1.analyticsRoutes);
app.use('/api/webhooks', webhooks_1.webhookRoutes);
app.use('/api/test', test_1.testRoutes);
app.use('/api/admin', admin_1.adminRoutes);
// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'API endpoint not found'
        }
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';
    res.status(error.status || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'An unexpected error occurred',
            ...(isDev && { stack: error.stack })
        }
    });
});
// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Cash Flow Finder API server running on port ${PORT}`);
    // Test database connections on startup
    const dbConnected = await (0, index_1.testConnections)();
    if (!dbConnected) {
        console.error('⚠️  Database connection failed - some features may not work');
    }
});
exports.default = app;
