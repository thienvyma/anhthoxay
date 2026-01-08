#!/bin/bash
# ============================================
# NỘI THẤT NHANH - Google Cloud Setup Script
# Run this script once to set up GCP resources
# ============================================

set -e

# Configuration
PROJECT_ID="noithatnhanh"
REGION="asia-southeast1"
DB_INSTANCE="ntn-db"
DB_NAME="ntn_production"
DB_USER="ntn_user"
BUCKET_NAME="ntn-media-bucket"
REPO_NAME="ntn-repo"

echo "🚀 Setting up Google Cloud for NỘI THẤT NHANH..."

# 1. Set project
echo "📌 Setting project..."
gcloud config set project $PROJECT_ID

# 2. Enable required APIs
echo "🔧 Enabling APIs..."
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  redis.googleapis.com \
  vpcaccess.googleapis.com

# 3. Create Artifact Registry repository
echo "📦 Creating Artifact Registry..."
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="NỘI THẤT NHANH Docker images" \
  2>/dev/null || echo "Repository already exists"

# 4. Create Cloud SQL instance
echo "🗄️ Creating Cloud SQL instance..."
gcloud sql instances describe $DB_INSTANCE 2>/dev/null || \
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=04

# 5. Create database
echo "📊 Creating database..."
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE 2>/dev/null || echo "Database already exists"

# 6. Create database user (prompt for password)
echo "👤 Creating database user..."
read -sp "Enter password for database user '$DB_USER': " DB_PASSWORD
echo
gcloud sql users create $DB_USER \
  --instance=$DB_INSTANCE \
  --password=$DB_PASSWORD \
  2>/dev/null || echo "User already exists"

# 7. Create Cloud Storage bucket
echo "📁 Creating Cloud Storage bucket..."
gcloud storage buckets create gs://$BUCKET_NAME \
  --location=$REGION \
  --uniform-bucket-level-access \
  2>/dev/null || echo "Bucket already exists"

# Make bucket public for media files
gcloud storage buckets add-iam-policy-binding gs://$BUCKET_NAME \
  --member=allUsers \
  --role=roles/storage.objectViewer

# 8. Create Memorystore Redis instance (optional - for rate limiting)
echo "🔴 Creating Redis instance..."
gcloud redis instances describe ntn-redis --region=$REGION 2>/dev/null || \
gcloud redis instances create ntn-redis \
  --size=1 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=basic

# 9. Create VPC connector for Cloud Run to access Redis
echo "🔗 Creating VPC connector..."
gcloud compute networks vpc-access connectors describe ntn-connector --region=$REGION 2>/dev/null || \
gcloud compute networks vpc-access connectors create ntn-connector \
  --region=$REGION \
  --range=10.8.0.0/28

# 10. Create secrets
echo "🔐 Creating secrets..."

# Get Cloud SQL connection name
CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')

# Database URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME?host=/cloudsql/$CONNECTION_NAME"
echo -n "$DATABASE_URL" | gcloud secrets create DATABASE_URL --data-file=- 2>/dev/null || \
echo -n "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=-

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=- 2>/dev/null || \
echo "JWT_SECRET already exists"

# Encryption Key
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo -n "$ENCRYPTION_KEY" | gcloud secrets create ENCRYPTION_KEY --data-file=- 2>/dev/null || \
echo "ENCRYPTION_KEY already exists"

# Redis URL
REDIS_HOST=$(gcloud redis instances describe ntn-redis --region=$REGION --format='value(host)')
REDIS_URL="redis://$REDIS_HOST:6379"
echo -n "$REDIS_URL" | gcloud secrets create REDIS_URL --data-file=- 2>/dev/null || \
echo -n "$REDIS_URL" | gcloud secrets versions add REDIS_URL --data-file=-

# 11. Grant Cloud Run access to secrets
echo "🔑 Granting permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_RUN_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for SECRET in DATABASE_URL JWT_SECRET ENCRYPTION_KEY REDIS_URL; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$CLOUD_RUN_SA" \
    --role="roles/secretmanager.secretAccessor"
done

# Grant Cloud Run access to Cloud SQL
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$CLOUD_RUN_SA" \
  --role="roles/cloudsql.client"

# 12. Create Cloud Build triggers
echo "🔨 Creating Cloud Build triggers..."

# Note: You need to connect your GitHub repo first via Cloud Console
# Then run these commands:

# gcloud builds triggers create github \
#   --name="ntn-api-trigger" \
#   --repo-name="noi-that-nhanh" \
#   --repo-owner="YOUR_GITHUB_USERNAME" \
#   --branch-pattern="^main$" \
#   --included-files="api/**,packages/**,infra/prisma/**" \
#   --build-config="infra/gcp/cloudbuild-api.yaml"

# gcloud builds triggers create github \
#   --name="ntn-landing-trigger" \
#   --repo-name="noi-that-nhanh" \
#   --repo-owner="YOUR_GITHUB_USERNAME" \
#   --branch-pattern="^main$" \
#   --included-files="landing/**,packages/**" \
#   --build-config="infra/gcp/cloudbuild-landing.yaml"

# gcloud builds triggers create github \
#   --name="ntn-admin-trigger" \
#   --repo-name="noi-that-nhanh" \
#   --repo-owner="YOUR_GITHUB_USERNAME" \
#   --branch-pattern="^main$" \
#   --included-files="admin/**,packages/**" \
#   --build-config="infra/gcp/cloudbuild-admin.yaml"

# gcloud builds triggers create github \
#   --name="ntn-portal-trigger" \
#   --repo-name="noi-that-nhanh" \
#   --repo-owner="YOUR_GITHUB_USERNAME" \
#   --branch-pattern="^main$" \
#   --included-files="portal/**,packages/**" \
#   --build-config="infra/gcp/cloudbuild-portal.yaml"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Connect your GitHub repo in Cloud Console > Cloud Build > Triggers"
echo "2. Create Cloud Build triggers using the commands above"
echo "3. Push code to main branch to trigger deployment"
echo ""
echo "🔗 URLs after deployment:"
echo "   API:     https://ntn-api-xxxxx-as.a.run.app"
echo "   Landing: https://ntn-landing-xxxxx-as.a.run.app"
echo "   Admin:   https://ntn-admin-xxxxx-as.a.run.app"
echo "   Portal:  https://ntn-portal-xxxxx-as.a.run.app"
echo ""
echo "💡 To map custom domains, use Cloud Run > Manage Custom Domains"
