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

## PM2 Configuration
- **Environment Variables**: Use `ecosystem.config.js` with explicit env vars to avoid SASL errors
- **Restart Command**: `pm2 delete cashflow-finder && pm2 start ecosystem.config.js`
- **Auto-Start**: PM2 startup and save configured for boot persistence
- **Logs**: `/var/log/cashflow-finder-*.log`

### Common SASL Error Fix:
If you see "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string":
1. Check that `ecosystem.config.js` has explicit DATABASE_* environment variables
2. Restart PM2: `pm2 delete cashflow-finder && pm2 start ecosystem.config.js`
3. Verify env vars: `pm2 env [process_id]`

## Critical: Always configure nginx for HTTP-only backend with Cloudflare proxy frontend