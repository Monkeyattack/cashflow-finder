#!/bin/bash

# Deploy advanced search page to VPS
echo "🚀 Deploying advanced search page to VPS..."

# Change to project directory
cd /home/cashflow_user/cashflow-trader || exit 1

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin master

# Copy advanced search file to nginx web root
echo "📁 Copying advanced search page to web root..."
sudo cp advanced-search.html /var/www/html/search.html

# Update nginx configuration for search route
echo "⚙️  Updating nginx configuration..."
sudo tee /etc/nginx/sites-available/cashflow-finder > /dev/null <<'NGINX_EOF'
server {
    listen 80;
    server_name cashflowfinder.app www.cashflowfinder.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cashflowfinder.app www.cashflowfinder.app;

    ssl_certificate /etc/letsencrypt/live/cashflowfinder.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cashflowfinder.app/privkey.pem;

    # Static files
    location / {
        root /var/www/html;
        try_files $uri $uri/ @backend;
        index browse-with-auth.html;
    }

    # Advanced search page
    location /search {
        root /var/www/html;
        try_files /search.html =404;
    }

    # Business detail pages
    location ~ ^/business/(\d+)$ {
        root /var/www/html;
        try_files /business-detail.html =404;
    }

    # API routes to backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend fallback
    location @backend {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    # Reload nginx
    sudo systemctl reload nginx
    echo "🔄 Nginx reloaded successfully"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Restart the Node.js application
echo "🔄 Restarting application..."
cd /home/cashflow_user/cashflow-trader
npm run build:server

# Update PM2 process
pm2 restart cashflow-finder || pm2 start dist/server/server.js --name cashflow-finder

echo "✅ Advanced search page deployed successfully!"
echo "🌐 Available at: https://cashflowfinder.app/search"