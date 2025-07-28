# Cash Flow Finder - Business Acquisition Platform

A comprehensive SaaS platform for finding, analyzing, and acquiring profitable businesses with AI-powered due diligence and data insights.

## 🚀 Features

### Core Platform
- **Advanced Business Search**: Powerful filtering by industry, location, financials, and custom metrics
- **AI-Powered Due Diligence**: Automated risk assessment, ROI projections, and SBA loan qualification
- **Multi-Tenant Architecture**: Full organization and user management with role-based access
- **Subscription Management**: Three-tier pricing with Stripe integration ($49/$149/$399)
- **Data Export**: CSV and JSON export capabilities with tier-based restrictions

### Business Intelligence
- **Quality Scoring**: Automated data quality assessment for all listings
- **Risk Analysis**: Financial, legal, operational, and market risk evaluation
- **ROI Projections**: Comprehensive financial analysis and valuation tools
- **SBA Qualification**: Automated Small Business Administration loan eligibility assessment

### User Experience
- **Responsive Design**: Mobile-optimized interface with design system from marketing site
- **Real-time Analytics**: Usage tracking and dashboard metrics
- **Watchlist Management**: Save and organize business opportunities
- **Team Collaboration**: Multi-user organizations with permission management

## 🏗️ Architecture

### Backend Stack
- **Node.js + TypeScript**: Type-safe server-side development
- **Express.js**: RESTful API with OpenAPI specifications
- **PostgreSQL**: Primary database for transactional data
- **Firestore**: Real-time features and caching
- **Firebase Auth**: Authentication with custom JWT claims
- **Stripe**: Subscription and payment processing

### Frontend Stack
- **Next.js**: React framework with SSR and SEO optimization
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first styling with custom design system
- **Firebase SDK**: Client-side authentication

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Firebase project
- Stripe account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cashflow-trader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb cashflow_finder
   
   # Run database schema
   psql -d cashflow_finder -f src/server/database/schema.sql
   ```

5. **Firebase Setup**
   - Create a new Firebase project
   - Enable Authentication with Email/Password
   - Generate service account credentials
   - Add configuration to .env file

6. **Stripe Setup**
   - Create Stripe account and get API keys
   - Create subscription products for three tiers
   - Set up webhook endpoint for `/api/webhooks/stripe`
   - Add price IDs to .env file

## 🚦 Running the Application

### Development Mode
```bash
# Run both frontend and backend in development
npm run dev

# Backend will run on http://localhost:3000
# Frontend will run on http://localhost:3001
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📋 Subscription Tiers

### Starter - $49/month
- 100 business searches/month
- Basic listing access
- Standard contact information  
- Limited data history (30 days)
- Email support only

### Professional - $149/month  
- 500 searches/month
- Advanced filtering
- Full contact data
- ROI calculation tools
- CSV exports & data enrichment
- SBA loan qualification assessments
- 12-month data history
- Due diligence reports
- Priority support

### Enterprise - $399/month
- Unlimited searches
- API access
- Custom integrations
- White-label options
- Advanced analytics
- Dedicated account manager
- Custom data feeds
- Bulk operations
- Comprehensive due diligence automation

## 🔒 Security Features

- **GDPR/SOC2 Compliance**: Data encryption, access controls, audit trails
- **Role-Based Access**: Granular permissions for multi-tenant organizations
- **Rate Limiting**: API protection and usage controls
- **Data Encryption**: At-rest and in-transit encryption with Cloud KMS
- **Privacy by Design**: Minimal data collection with explicit consent

## 📊 Analytics & Monitoring

- **Usage Tracking**: Comprehensive analytics for searches, exports, and API calls
- **Real-time Dashboards**: Business metrics and conversion analytics
- **Revenue Attribution**: Multi-touch attribution for affiliate programs
- **Performance Monitoring**: System health and response time tracking

## 🔗 API Documentation

The API follows RESTful conventions with comprehensive error handling:

### Authentication
```
POST /api/auth/signup    - Create new user account
POST /api/auth/login     - Authenticate user
GET  /api/auth/me        - Get current user info
```

### Business Listings
```
GET    /api/business/search      - Search business listings
GET    /api/business/:id         - Get specific business
POST   /api/business/export      - Export search results
POST   /api/business/:id/watchlist - Add to watchlist
```

### Subscription Management
```
GET  /api/subscription/status    - Get subscription status
POST /api/subscription/upgrade   - Upgrade subscription tier
GET  /api/subscription/usage     - Get current usage
```

## 🚀 Deployment

### Recommended Stack
- **Frontend**: Vercel or Netlify
- **Backend**: Google Cloud Run or AWS Lambda
- **Database**: Google Cloud SQL or AWS RDS
- **CDN**: Cloudflare

### Environment Variables
See `.env.example` for complete configuration requirements.

## 📈 Monetization Strategy

Based on comprehensive competitor analysis:

### Revenue Streams
1. **Subscription Revenue**: $49-$399/month recurring revenue
2. **Affiliate Commissions**: Business financing, legal services, insurance
3. **Premium Services**: Due diligence reports, business valuations
4. **API Access**: Enterprise integrations and custom solutions

### Target Metrics (6 months)
- **Revenue**: $50K MRR with 25% month-over-month growth
- **Users**: 1,000 paying customers across all tiers
- **Conversion**: 20% trial-to-paid conversion rate
- **Retention**: 85% annual retention rate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in this repository
- Email: support@cashflowfinder.com
- Documentation: [Internal Wiki]

---

**Cash Flow Finder** - Empowering business acquisition decisions with AI-powered insights and comprehensive data intelligence.