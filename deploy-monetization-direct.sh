#!/bin/bash

# Direct deployment of monetization files to VPS
echo "🚀 Deploying monetization files directly to VPS..."

VPS_HOST="172.93.51.42"
VPS_PATH="/opt/apps/cashflow-finder"
SSH_KEY="~/.ssh/tao_alpha_dca_key"

# Build locally first
echo "🔨 Building TypeScript locally..."
npm run build:server

# Fix line endings
echo "🔧 Converting line endings..."
dos2unix vps-monetization-fix.sh 2>/dev/null || sed -i 's/\r$//' vps-monetization-fix.sh

# Create directory structure on VPS
echo "📁 Creating directory structure on VPS..."
ssh -i $SSH_KEY root@$VPS_HOST << 'EOF'
cd /opt/apps/cashflow-finder
mkdir -p dist/server/routes
mkdir -p dist/server/services
mkdir -p dist/server/scripts
EOF

# Copy compiled files
echo "📤 Copying compiled monetization files..."
scp -i $SSH_KEY dist/server/routes/auth-oauth.js root@$VPS_HOST:$VPS_PATH/dist/server/routes/
scp -i $SSH_KEY dist/server/services/tier-access.js root@$VPS_HOST:$VPS_PATH/dist/server/services/
scp -i $SSH_KEY dist/server/services/book-recommendations.js root@$VPS_HOST:$VPS_PATH/dist/server/services/
scp -i $SSH_KEY dist/server/routes/business.js root@$VPS_HOST:$VPS_PATH/dist/server/routes/
scp -i $SSH_KEY dist/server/server.js root@$VPS_HOST:$VPS_PATH/dist/server/
scp -i $SSH_KEY vps-monetization-fix.sh root@$VPS_HOST:$VPS_PATH/

# Also copy updated schema for reference
scp -i $SSH_KEY src/server/database/schema.sql root@$VPS_HOST:$VPS_PATH/schema-monetization.sql

# Install dependencies and run on VPS
ssh -i $SSH_KEY root@$VPS_HOST << 'EOF'
cd /opt/apps/cashflow-finder

echo "📦 Checking dependencies..."
npm list google-auth-library || npm install google-auth-library
npm list uuid || npm install uuid
npm list axios || npm install axios

echo "🚀 Running monetization setup..."
chmod +x vps-monetization-fix.sh
bash vps-monetization-fix.sh

echo "✅ Deployment complete!"
EOF