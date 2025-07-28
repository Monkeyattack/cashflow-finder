"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./database");
const auth_1 = require("./routes/auth");
const business_1 = require("./routes/business");
const subscription_1 = require("./routes/subscription");
const analytics_1 = require("./routes/analytics");
const webhooks_1 = require("./routes/webhooks");
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
// Body parsing middleware
app.use('/api/webhooks', express_1.default.raw({ type: 'application/json' })); // Raw for Stripe webhooks
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbConnected = await (0, database_1.testConnections)();
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
// API Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/business', business_1.businessRoutes);
app.use('/api/subscription', subscription_1.subscriptionRoutes);
app.use('/api/analytics', analytics_1.analyticsRoutes);
app.use('/api/webhooks', webhooks_1.webhookRoutes);
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
    const dbConnected = await (0, database_1.testConnections)();
    if (!dbConnected) {
        console.error('⚠️  Database connection failed - some features may not work');
    }
});
exports.default = app;
