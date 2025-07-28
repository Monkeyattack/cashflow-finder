#!/bin/bash

# Cash Flow Finder - Automated Backup Script
# Backs up PostgreSQL database and Redis data to Cloud Storage

set -e

# Configuration
PROJECT_ID="cashflow-finder-prod"
DB_INSTANCE_NAME="cashflow-finder-db"
DB_NAME="cashflow_finder"
BUCKET_NAME="cashflow-finder-backups"
REDIS_INSTANCE_NAME="cashflow-finder-cache"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
echo_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# Create backup bucket if it doesn't exist
create_backup_bucket() {
    echo_info "Creating backup bucket..."
    
    if ! gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
        gsutil mb gs://$BUCKET_NAME
        gsutil lifecycle set - gs://$BUCKET_NAME << 'LIFECYCLE_EOF'
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
LIFECYCLE_EOF
        echo_success "Backup bucket created with 30-day retention"
    else
        echo_info "Backup bucket already exists"
    fi
}

# Backup PostgreSQL database
backup_database() {
    echo_info "Starting database backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="db_backup_${TIMESTAMP}.sql"
    
    # Create database backup
    gcloud sql export sql $DB_INSTANCE_NAME gs://$BUCKET_NAME/$BACKUP_FILE \
        --database=$DB_NAME
    
    echo_success "Database backup completed: $BACKUP_FILE"
}

# Backup Redis (export configuration)
backup_redis() {
    echo_info "Backing up Redis configuration..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CONFIG_FILE="redis_config_${TIMESTAMP}.txt"
    
    # Export Redis instance details
    gcloud redis instances describe $REDIS_INSTANCE_NAME \
        --region=us-central1 > /tmp/$CONFIG_FILE
    
    gsutil cp /tmp/$CONFIG_FILE gs://$BUCKET_NAME/
    rm /tmp/$CONFIG_FILE
    
    echo_success "Redis configuration backed up: $CONFIG_FILE"
}

# List recent backups
list_backups() {
    echo_info "Recent backups:"
    gsutil ls -l gs://$BUCKET_NAME/ | tail -10
}

# Main backup process
main() {
    echo_info "Starting automated backup process..."
    
    create_backup_bucket
    backup_database
    backup_redis
    list_backups
    
    echo_success "🎉 Backup process completed successfully!"
}

# Check if running as cron job or manual
if [ "$1" = "--cron" ]; then
    # Silent mode for cron
    main > /var/log/cashflow-backup.log 2>&1
else
    main
fi