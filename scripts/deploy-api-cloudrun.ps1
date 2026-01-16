# Deploy API to Cloud Run
# Usage: .\scripts\deploy-api-cloudrun.ps1

$PROJECT_ID = "noithatnhanh-f8f72"
$REGION = "asia-southeast1"
$SERVICE_NAME = "ntn-api"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Deploying API to Cloud Run..." -ForegroundColor Cyan

# Set project
Write-Host "📋 Setting project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build and deploy using Cloud Build
Write-Host "🏗️ Building and deploying..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=$PROJECT_ID" `
    --memory 512Mi `
    --cpu 1 `
    --min-instances 0 `
    --max-instances 10 `
    --timeout 60s

Write-Host "✅ Deployment complete!" -ForegroundColor Green
