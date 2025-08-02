# VPS Configuration Notes

## Server Details
- **IP**: 172.93.51.42
- **Domain**: cashflowfinder.app (Cloudflare proxied with SSL)
- **SSH Key**: ~/.ssh/tao_alpha_dca_key
- **User**: root

## Deployment Setup
- **Repository**: /opt/apps/cashflow-finder
- **Web Root**: /var/www/html/
- **Nginx Config**: /etc/nginx/sites-available/cashflow-finder
- **PM2 Process**: cashflow-finder (port 3000)

## Key Configuration Points
1. **Cloudflare Frontend**: All SSL termination handled by Cloudflare proxy
2. **Nginx HTTP Only**: Configured for HTTP backend, Cloudflare handles HTTPS
3. **Environment**: Requires .env file in project root with dotenv loading in server.ts
4. **Database**: PostgreSQL with cashflow_user/AirpUgWN33IcU93D credentials

## Static File Serving
- Main page: index.html (browse-with-auth.html)
- Search page: search.html (advanced-search.html) 
- Business detail: business-detail.html
- Email alerts: alerts.html
- SBA calculator: calculator.html
- Assets: favicon.svg and other static files in /var/www/html/
- Static assets served with 1-year caching for performance

## Deployment Process
1. Push changes to GitHub repo
2. Pull on VPS: `git pull origin master`
3. Copy HTML files: `cp *.html /var/www/html/`
4. Build server: `npm run build:server`
5. Restart PM2: `pm2 restart cashflow-finder`

## Critical: Always configure nginx for HTTP-only backend with Cloudflare proxy frontend