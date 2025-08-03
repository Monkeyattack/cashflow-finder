# Project Memory - Cash Flow Finder

## User Complaints and Issues (2025-08-03)

### Critical Issues to Remember:
1. **Business detail page still broken** - "Failed to load business details" on both main site and browse-new-design.html
2. **Stock image prices and brand link** - Fixed on main site (/) but NOT on browse-new-design.html 
3. **Real business data missing** - Database should contain scraped real business data, not mock/sample data
4. **Unnecessary complexity** - User questions why separate storage modules are needed instead of simple database queries
5. **Functionality broken** - Filter dropdowns don't work, search broken, basic functionality removed for cosmetic changes
6. **Repeated rollbacks** - Keep fixing same issues (price badges, brand links) that get re-added accidentally

### User Frustration Points:
- "You are going to compact and make me start over" - indicating this has happened before
- "You fixed nothing and rolled back several fixes" 
- "You took all the functionality out to add some basic look and feel changes"
- Multiple requests for real data scraping that haven't been properly implemented

### Technical Requirements:
1. **Real business scraping** - Need actual business listings scraped from BizBuySell, BusinessesForSale, etc.
2. **Single source of truth** - All pages should use same business data from database
3. **Functional filters** - Industry, location, price filters must work
4. **Working business detail pages** - Must load real business data successfully
5. **No mock data** - Remove all sample/mock business data

### Pages to Fix:
- `/browse-new-design.html` - Still has stock image prices and brand link
- Business detail pages - Still broken with "Failed to load business details"
- Main landing page - Working correctly

### Architecture Issues:
- Don't create separate storage modules when simple database queries work
- Use consistent API endpoints across all pages
- Ensure business IDs work across browse → detail page flow

## Previous Context:
This project is a business marketplace (Cash Flow Finder) where users can browse businesses for sale. The user has been frustrated with repeated issues and wants:
1. Real scraped business data in database
2. Working browse/detail page flow  
3. Functional search and filters
4. Clean design without stock image prices or unnecessary links

## Infrastructure Configuration

### VPS Connection Info:
- **SSH Command**: `ssh -i ~/.ssh/tao_alpha_dca_key root@172.93.51.42`
- **Server IP**: 172.93.51.42
- **SSH Key**: ~/.ssh/tao_alpha_dca_key
- **Domain**: cashflowfinder.app

### Deployment Info:
- **App Directory**: /opt/apps/cashflow-finder
- **Nginx Root**: /var/www/html
- **Git Repository**: https://github.com/Monkeyattack/cashflow-finder.git
- **Branch**: master

### Database Connection:
- **Host**: localhost
- **Database**: cashflow_finder
- **User**: cashflow_user
- **Password**: AirpUgWN33IcU93D
- **Port**: 5432

### Deployment Process:
1. `ssh -i ~/.ssh/tao_alpha_dca_key root@172.93.51.42`
2. `cd /opt/apps/cashflow-finder && git pull`
3. `cp [files] /var/www/html/` (for static files)
4. `npm run build:server` (if needed)
5. `pm2 restart cashflow-finder` (if needed)

### Current Status:
- Configure nginx with specific setup for VPS apps
- Cloudflare is used for running applications
- Update global configuration for infrastructure