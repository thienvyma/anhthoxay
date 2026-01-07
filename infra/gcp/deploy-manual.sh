#!/bin/bash
# ============================================
# ANH THỢ XÂY - Manual Deploy Script
# Use this for quick manual deployments
# ============================================

set -e

PROJECT_ID="noithatnhanh"
REGION="asia-southeast1"
REPO="asia-southeast1-docker.pkg.dev/$PROJECT_ID/ntn-repo"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
APP=$1
if [ -z "$APP" ]; then
  echo -e "${YELLOW}Usage: ./deploy-manual.sh <app>${NC}"
  echo "Available apps: api, landing, admin, portal, all"
  exit 1
fi

# Set project
gcloud config set project $PROJECT_ID

# Function to deploy API
deploy_api() {
  echo -e "${GREEN}🚀 Deploying API...${NC}"
  
  # Build
  docker build \
    -t $REPO/api:latest \
    -f infra/docker/api.Dockerfile \
    .
  
  # Push
  docker push $REPO/api:latest
  
  # Deploy
  gcloud run deploy ntn-api \
    --image=$REPO/api:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,ENCRYPTION_KEY=ENCRYPTION_KEY:latest,REDIS_URL=REDIS_URL:latest" \
    --min-instances=0 \
    --max-instances=10 \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300 \
    --concurrency=80
  
  echo -e "${GREEN}✅ API deployed!${NC}"
}

# Function to deploy frontend app
deploy_frontend() {
  local app_name=$1
  local api_url=${2:-"https://api.anhthoxay.vn"}
  
  echo -e "${GREEN}🚀 Deploying $app_name...${NC}"
  
  # Build
  docker build \
    -t $REPO/$app_name:latest \
    -f infra/docker/frontend.Dockerfile \
    --build-arg APP_NAME=$app_name \
    --build-arg VITE_API_URL=$api_url \
    .
  
  # Push
  docker push $REPO/$app_name:latest
  
  # Deploy
  gcloud run deploy ntn-$app_name \
    --image=$REPO/$app_name:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=5 \
    --memory=256Mi \
    --cpu=1 \
    --timeout=60 \
    --concurrency=100
  
  echo -e "${GREEN}✅ $app_name deployed!${NC}"
}

# Configure Docker for GCP
echo -e "${YELLOW}🔧 Configuring Docker for GCP...${NC}"
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# Deploy based on argument
case $APP in
  api)
    deploy_api
    ;;
  landing)
    deploy_frontend "landing"
    ;;
  admin)
    deploy_frontend "admin"
    ;;
  portal)
    deploy_frontend "portal"
    ;;
  all)
    deploy_api
    deploy_frontend "landing"
    deploy_frontend "admin"
    deploy_frontend "portal"
    ;;
  *)
    echo -e "${RED}Unknown app: $APP${NC}"
    echo "Available apps: api, landing, admin, portal, all"
    exit 1
    ;;
esac

# Show URLs
echo ""
echo -e "${GREEN}🔗 Service URLs:${NC}"
gcloud run services list --region=$REGION --format="table(SERVICE,URL)"
