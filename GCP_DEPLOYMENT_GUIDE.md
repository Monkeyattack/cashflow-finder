# GCP Deployment Guide

Complete guide for deploying Cash Flow Finder to Google Cloud Platform with minimal cost and maximum efficiency.

## 🚀 **Quick Start**

```bash
# 1. Clone repository
git clone https://github.com/Monkeyattack/cashflow-finder.git
cd cashflow-finder

# 2. Make deployment script executable
chmod +x deploy-gcp.sh

# 3. Run deployment
./deploy-gcp.sh
```

## 📋 **Prerequisites**

### Required Tools
- [ ] **Google Cloud SDK** - [Install gcloud CLI](https://cloud.google.com/sdk/docs/install)
- [ ] **Git** - For code deployment
- [ ] **Domain access** - DNS management for cashflowfinder.app

### GCP Setup
- [ ] **Google Cloud Account** with billing enabled
- [ ] **Project created** - `cashflow-finder-prod` (or custom name)
- [ ] **Owner/Editor permissions** on the project

### Authentication
```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project cashflow-finder-prod
```

## 🏗️ **What the Deployment Script Does**

### 1. **Infrastructure Setup**
- Creates **Cloud SQL PostgreSQL** instance (db-f1-micro, 10GB)
- Creates **Memorystore Redis** instance (1GB, basic tier)
- Creates **e2-micro VM** (20GB disk, minimal cost)
- Configures **VPC firewall rules** for HTTP/HTTPS traffic

### 2. **Database Configuration**
- Sets up PostgreSQL database with secure password
- Stores credentials in **Secret Manager**
- Configures automated backups (daily at 3 AM)
- Creates database user with proper permissions

### 3. **VM Application Setup**
- Installs **Node.js 18**, **Nginx**, **PM2**
- Clones code from GitHub repository
- Builds the Next.js application
- Configures **reverse proxy** with Nginx
- Sets up **SSL-ready** configuration for Certbot

### 4. **Monitoring & Logging**
- Installs **Google Cloud Ops Agent**
- Configures **uptime monitoring**
- Sets up **centralized logging**
- Creates **performance dashboards**

### 5. **CI/CD Pipeline**
- Creates **GitHub Actions workflow**
- Automated deployment on main branch pushes
- Includes build tests and deployment verification

### 6. **Security & Performance**
- **Firewall rules** for HTTP/HTTPS only
- **Security headers** in Nginx
- **Gzip compression** enabled
- **Cache-Control** headers for static assets

## 💰 **Cost Breakdown (Monthly)**

| Service | Configuration | Estimated Cost |
|---------|---------------|----------------|
| **Compute Engine** | e2-micro VM | ~$5-7 |
| **Cloud SQL** | db-f1-micro PostgreSQL | ~$8-10 |
| **Memorystore Redis** | 1GB Basic | ~$12-15 |
| **Network Egress** | Standard usage | ~$1-3 |
| **Cloud Storage** | Backups & logs | ~$1-2 |
| **Monitoring** | Basic monitoring | Free tier |
| **Total** | | **~$27-37/month** |

## 🔧 **Post-Deployment Setup**

### 1. **Domain Configuration**
```bash
# Get VM IP address
gcloud compute instances describe cashflow-finder-vm --zone=us-central1-a --format="value(networkInterfaces[0].accessConfigs[0].natIP)"

# Update DNS records:
# A record: cashflowfinder.app → VM_IP
# A record: www.cashflowfinder.app → VM_IP
```

### 2. **SSH into VM**
```bash
gcloud compute ssh cashflow-finder-vm --zone=us-central1-a
```

### 3. **Configure Environment Variables**
```bash
cd /opt/cashflow-finder
nano .env

# Add your secrets:
# NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-key
# STRIPE_SECRET_KEY=your-stripe-key
# JWT_SECRET=your-jwt-secret
```

### 4. **Set up SSL Certificate**
```bash
# Install SSL certificate (run on VM)
sudo certbot --nginx -d cashflowfinder.app -d www.cashflowfinder.app

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5. **Start Application**
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save

# Enable services
sudo systemctl enable nginx
sudo systemctl start nginx

# Check status
pm2 status
sudo systemctl status nginx
```

## 🗂️ **File Structure After Deployment**

```
/opt/cashflow-finder/
├── src/                     # Application source code
├── .next/                   # Built Next.js application
├── node_modules/            # Dependencies
├── .env                     # Environment variables
├── ecosystem.config.js      # PM2 configuration
└── package.json            # Project configuration

/etc/nginx/sites-available/
└── cashflow-finder         # Nginx configuration

/var/log/
├── pm2/                    # Application logs
└── nginx/                  # Web server logs
```

## 🔍 **Monitoring & Troubleshooting**

### Application Logs
```bash
# PM2 logs
pm2 logs cashflow-finder

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
journalctl -u nginx -f
```

### Health Checks
```bash
# Check application status
curl http://localhost:3000/health

# Check SSL certificate
curl -I https://cashflowfinder.app

# Check database connection
gcloud sql instances describe cashflow-finder-db
```

### Google Cloud Console
- **Compute Engine**: [VM instances](https://console.cloud.google.com/compute/instances)
- **Cloud SQL**: [Database instances](https://console.cloud.google.com/sql/instances)
- **Memorystore**: [Redis instances](https://console.cloud.google.com/memorystore/redis/instances)
- **Monitoring**: [Dashboards](https://console.cloud.google.com/monitoring)
- **Logging**: [Logs Explorer](https://console.cloud.google.com/logs)

## 🔄 **Automated Deployments**

### GitHub Secrets Setup
1. Create a **Service Account** in GCP
2. Download the **JSON key file**
3. Add `GCP_SA_KEY` secret to GitHub repository
4. Push to main branch triggers deployment

### Manual Deployment
```bash
# From your local machine
git push origin main

# Or deploy specific commit
git push origin <commit-hash>:main
```

## 📦 **Backup & Recovery**

### Automated Backups
```bash
# Database backups (daily)
chmod +x backup-script.sh
./backup-script.sh

# Set up cron job for daily backups
crontab -e
# Add: 0 2 * * * /opt/cashflow-finder/backup-script.sh --cron
```

### Manual Backup
```bash
# Export database
gcloud sql export sql cashflow-finder-db gs://your-backup-bucket/manual-backup.sql --database=cashflow_finder

# Download backup
gsutil cp gs://your-backup-bucket/manual-backup.sql .
```

### Recovery
```bash
# Restore database
gcloud sql import sql cashflow-finder-db gs://your-backup-bucket/backup-file.sql
```

## 🔧 **Scaling & Optimization**

### Vertical Scaling (Increase VM size)
```bash
# Stop VM
gcloud compute instances stop cashflow-finder-vm --zone=us-central1-a

# Resize to larger machine type
gcloud compute instances set-machine-type cashflow-finder-vm --machine-type=e2-small --zone=us-central1-a

# Start VM
gcloud compute instances start cashflow-finder-vm --zone=us-central1-a
```

### Database Scaling
```bash
# Upgrade database tier
gcloud sql instances patch cashflow-finder-db --tier=db-n1-standard-1
```

### Redis Scaling
```bash
# Scale Redis memory
gcloud redis instances update cashflow-finder-cache --size=2 --region=us-central1
```

## 🚨 **Common Issues & Solutions**

### Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check environment variables
cat /opt/cashflow-finder/.env

# Restart application
pm2 restart cashflow-finder
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Database Connection Issues
```bash
# Check Cloud SQL status
gcloud sql instances describe cashflow-finder-db

# Test connection from VM
psql -h INSTANCE_IP -U cfinder_admin -d cashflow_finder
```

### High Memory Usage
```bash
# Check Redis memory usage
redis-cli info memory

# Clear cache if needed
redis-cli flushall
```

## 📞 **Support Resources**

- **Google Cloud Documentation**: [cloud.google.com/docs](https://cloud.google.com/docs)
- **Next.js Deployment**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **PM2 Documentation**: [pm2.keymetrics.io/docs](https://pm2.keymetrics.io/docs)
- **Nginx Configuration**: [nginx.org/en/docs](http://nginx.org/en/docs/)

---

**🎉 Your Cash Flow Finder platform should now be running on `https://cashflowfinder.app`**

**Need help?** Check the monitoring dashboards or review the logs for any issues.