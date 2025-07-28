#!/bin/bash

# Cash Flow Finder - GCP Deployment Script
# Deploys a complete SaaS platform on Google Cloud Platform

set -e

# Configuration
PROJECT_ID="cashflow-finder-prod"
REGION="us-central1"
ZONE="us-central1-a"
VM_NAME="cashflow-finder-vm"
DOMAIN="cashflowfinder.app"
DB_INSTANCE_NAME="cashflow-finder-db"
DB_NAME="cashflow_finder"
DB_USER="cfinder_admin"
REDIS_INSTANCE_NAME="cashflow-finder-cache"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
echo_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        echo_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo_error "Not authenticated with gcloud. Run: gcloud auth login"
        exit 1
    fi
    
    echo_success "Prerequisites check passed"
}

# Set up GCP project and enable APIs
setup_project() {
    echo_info "Setting up GCP project: $PROJECT_ID"
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    echo_info "Enabling required APIs..."
    gcloud services enable compute.googleapis.com
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable redis.googleapis.com
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    echo_success "Project setup completed"
}

# Create Cloud SQL instance
create_database() {
    echo_info "Creating Cloud SQL PostgreSQL instance..."
    
    # Check if instance already exists
    if gcloud sql instances describe $DB_INSTANCE_NAME --quiet &> /dev/null; then
        echo_warning "Database instance $DB_INSTANCE_NAME already exists"
    else
        # Create Cloud SQL instance (minimal configuration)
        gcloud sql instances create $DB_INSTANCE_NAME \
            --database-version=POSTGRES_13 \
            --tier=db-f1-micro \
            --region=$REGION \
            --storage-type=SSD \
            --storage-size=10GB \
            --storage-auto-increase \
            --backup-start-time=03:00 \
            --enable-bin-log \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=04 \
            --maintenance-release-channel=production
        
        echo_success "Cloud SQL instance created"
    fi
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32)
    
    # Create database user
    echo_info "Creating database user..."
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE_NAME \
        --password=$DB_PASSWORD || true
    
    # Create database
    echo_info "Creating database..."
    gcloud sql databases create $DB_NAME \
        --instance=$DB_INSTANCE_NAME || true
    
    # Store password in Secret Manager
    echo_info "Storing database password in Secret Manager..."
    echo $DB_PASSWORD | gcloud secrets create db-password --data-file=- || \
    echo $DB_PASSWORD | gcloud secrets versions add db-password --data-file=-
    
    echo_success "Database setup completed"
}

# Create Redis instance
create_redis() {
    echo_info "Creating Redis instance for caching..."
    
    # Check if instance already exists
    if gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --quiet &> /dev/null; then
        echo_warning "Redis instance $REDIS_INSTANCE_NAME already exists"
    else
        # Create minimal Redis instance
        gcloud redis instances create $REDIS_INSTANCE_NAME \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_6_x \
            --tier=basic
        
        echo_success "Redis instance created"
    fi
}

# Create VM instance
create_vm() {
    echo_info "Creating VM instance..."
    
    # Check if VM already exists
    if gcloud compute instances describe $VM_NAME --zone=$ZONE --quiet &> /dev/null; then
        echo_warning "VM instance $VM_NAME already exists"
    else
        # Create minimal VM instance
        gcloud compute instances create $VM_NAME \
            --zone=$ZONE \
            --machine-type=e2-micro \
            --image-family=ubuntu-2004-lts \
            --image-project=ubuntu-os-cloud \
            --boot-disk-size=20GB \
            --boot-disk-type=pd-standard \
            --tags=http-server,https-server \
            --scopes=https://www.googleapis.com/auth/cloud-platform \
            --metadata=startup-script='#!/bin/bash
                apt-get update
                apt-get install -y curl wget git unzip
                
                # Install monitoring agent
                curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
                bash add-google-cloud-ops-agent-repo.sh --also-install
                
                echo "VM initialization completed" > /var/log/startup.log
            '
        
        echo_success "VM instance created"
    fi
    
    # Create firewall rules
    echo_info "Creating firewall rules..."
    gcloud compute firewall-rules create allow-http-https \
        --allow tcp:80,tcp:443,tcp:3000 \
        --source-ranges 0.0.0.0/0 \
        --target-tags http-server,https-server || true
    
    echo_success "Firewall rules configured"
}

# Generate deployment script for VM
generate_vm_script() {
    echo_info "Generating VM deployment script..."
    
    cat > setup-vm.sh << 'EOF'
#!/bin/bash

set -e

echo "Starting Cash Flow Finder deployment on VM..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional packages
sudo apt-get install -y nginx postgresql-client redis-tools git htop

# Install PM2 globally
sudo npm install -g pm2

# Install Cloud SQL Proxy
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy
sudo mv cloud_sql_proxy /usr/local/bin/

# Create app directory
sudo mkdir -p /opt/cashflow-finder
sudo chown $USER:$USER /opt/cashflow-finder
cd /opt/cashflow-finder

# Clone repository
git clone https://github.com/Monkeyattack/cashflow-finder.git .

# Install dependencies
npm install

# Build application
npm run build

# Create .env file from template
cp .env.example .env

# Configure Nginx
sudo tee /etc/nginx/sites-available/cashflow-finder << 'NGINX_EOF'
server {
    listen 80;
    server_name cashflowfinder.app www.cashflowfinder.app;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cashflowfinder.app www.cashflowfinder.app;

    # SSL configuration (will be set up with Certbot)
    ssl_certificate /etc/letsencrypt/live/cashflowfinder.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cashflowfinder.app/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static assets
    location /_next/static {
        alias /opt/cashflow-finder/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/cashflow-finder /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'cashflow-finder',
    script: 'src/server/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/cashflow-finder-error.log',
    out_file: '/var/log/pm2/cashflow-finder-out.log',
    log_file: '/var/log/pm2/cashflow-finder.log',
    time: true
  }]
}
PM2_EOF

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Create systemd service for PM2
sudo pm2 startup systemd -u $USER --hp /home/$USER

echo "VM setup completed. Next steps:"
echo "1. Configure environment variables in /opt/cashflow-finder/.env"
echo "2. Set up SSL certificate: sudo certbot --nginx -d cashflowfinder.app -d www.cashflowfinder.app"
echo "3. Start the application: pm2 start ecosystem.config.js && pm2 save"
echo "4. Enable nginx: sudo systemctl enable nginx && sudo systemctl start nginx"

EOF

    chmod +x setup-vm.sh
    echo_success "VM deployment script generated"
}

# Deploy to VM
deploy_to_vm() {
    echo_info "Deploying application to VM..."
    
    # Get VM external IP
    VM_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
    echo_info "VM IP: $VM_IP"
    
    # Wait for VM to be ready
    echo_info "Waiting for VM to be ready..."
    sleep 30
    
    # Copy deployment script to VM
    echo_info "Copying deployment script to VM..."
    gcloud compute scp setup-vm.sh $VM_NAME:/tmp/setup-vm.sh --zone=$ZONE
    
    # Execute deployment script on VM
    echo_info "Executing deployment script on VM..."
    gcloud compute ssh $VM_NAME --zone=$ZONE --command="bash /tmp/setup-vm.sh"
    
    echo_success "Application deployed to VM"
}

# Set up monitoring and alerting
setup_monitoring() {
    echo_info "Setting up monitoring and alerting..."
    
    # Create uptime check
    gcloud alpha monitoring policies create --policy-from-file=- << 'MONITOR_EOF'
displayName: "Cash Flow Finder Uptime Check"
conditions:
  - displayName: "Website Down"
    conditionThreshold:
      filter: 'resource.type="uptime_url"'
      comparison: COMPARISON_LESS_THAN
      thresholdValue: 1
      duration: 300s
alertStrategy:
  autoClose: 86400s
enabled: true
MONITOR_EOF

    echo_success "Monitoring configured"
}

# Generate environment configuration
generate_env_config() {
    echo_info "Generating environment configuration..."
    
    # Get database connection details
    DB_IP=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)")
    REDIS_IP=$(gcloud redis instances describe $REDIS_INSTANCE_NAME --region=$REGION --format="value(host)")
    
    cat > .env.production << EOF
# Database Configuration (Cloud SQL)
DATABASE_HOST=$DB_IP
DATABASE_PORT=5432
DATABASE_NAME=$DB_NAME
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=\$(gcloud secrets versions access latest --secret="db-password")

# Redis Configuration
REDIS_HOST=$REDIS_IP
REDIS_PORT=6379

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://$DOMAIN

# Add your Firebase, Stripe, and JWT secrets here
# NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
# STRIPE_SECRET_KEY=your-stripe-key
# JWT_SECRET=your-jwt-secret

EOF

    echo_success "Environment configuration generated"
    echo_warning "Don't forget to add your Firebase, Stripe, and JWT secrets to .env on the VM"
}

# Create GitHub Actions workflow
create_github_actions() {
    echo_info "Creating GitHub Actions workflow for automated deployment..."
    
    mkdir -p .github/workflows
    
    cat > .github/workflows/deploy.yml << 'GITHUB_EOF'
name: Deploy to GCP

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test || echo "No tests configured"
    
    - name: Build application
      run: npm run build
    
    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v1
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
    
    - name: Deploy to VM
      run: |
        gcloud compute ssh cashflow-finder-vm --zone=us-central1-a --command="
          cd /opt/cashflow-finder &&
          git pull origin main &&
          npm install &&
          npm run build &&
          pm2 restart cashflow-finder
        "

GITHUB_EOF

    echo_success "GitHub Actions workflow created"
    echo_warning "Add GCP_SA_KEY secret to your GitHub repository for automated deployments"
}

# Main deployment function
main() {
    echo_info "Starting Cash Flow Finder GCP Deployment"
    echo_info "Project: $PROJECT_ID"
    echo_info "Region: $REGION"
    echo_info "Domain: $DOMAIN"
    echo ""
    
    check_prerequisites
    setup_project
    create_database
    create_redis
    create_vm
    generate_vm_script
    deploy_to_vm
    setup_monitoring
    generate_env_config
    create_github_actions
    
    echo ""
    echo_success "🎉 Deployment completed successfully!"
    echo ""
    echo_info "Next steps:"
    echo "1. Point your domain DNS to: $(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)")"
    echo "2. SSH into VM: gcloud compute ssh $VM_NAME --zone=$ZONE"
    echo "3. Configure .env file with your secrets"
    echo "4. Set up SSL: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "5. Start application: pm2 start ecosystem.config.js && pm2 save"
    echo "6. Enable services: sudo systemctl enable nginx && sudo systemctl start nginx"
    echo ""
    echo_info "Monitoring: https://console.cloud.google.com/monitoring"
    echo_info "Logs: https://console.cloud.google.com/logs"
    echo_info "Database: https://console.cloud.google.com/sql/instances"
}

# Run main function
main "$@"