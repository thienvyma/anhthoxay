#!/bin/bash
# ============================================
# Setup Google Integration (Sheets + Gmail)
# ============================================
# Script này giúp cấu hình Google OAuth cho:
# - Google Sheets sync (đồng bộ leads)
# - Gmail API (gửi email báo giá)
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Setup Google Integration for ANH THỢ XÂY  ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI chưa được cài đặt${NC}"
    echo "Vui lòng cài đặt từ: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ Chưa set project. Chạy: gcloud config set project YOUR_PROJECT_ID${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Project: ${PROJECT_ID}${NC}"
echo ""

# ============================================
# Step 1: Enable APIs
# ============================================
echo -e "${YELLOW}📦 Bước 1: Enable Google APIs...${NC}"

gcloud services enable sheets.googleapis.com --quiet
echo -e "${GREEN}  ✓ Google Sheets API enabled${NC}"

gcloud services enable gmail.googleapis.com --quiet
echo -e "${GREEN}  ✓ Gmail API enabled${NC}"

gcloud services enable secretmanager.googleapis.com --quiet
echo -e "${GREEN}  ✓ Secret Manager API enabled${NC}"

echo ""

# ============================================
# Step 2: Collect credentials
# ============================================
echo -e "${YELLOW}🔑 Bước 2: Nhập thông tin OAuth Credentials${NC}"
echo ""
echo -e "${BLUE}Hướng dẫn tạo OAuth Credentials:${NC}"
echo "1. Vào: https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
echo "2. Click 'Create Credentials' > 'OAuth client ID'"
echo "3. Chọn 'Web application'"
echo "4. Thêm Authorized redirect URIs:"
echo "   - https://api.anhthoxay.com/integrations/google/callback"
echo "   - http://localhost:4202/integrations/google/callback (dev)"
echo "5. Copy Client ID và Client Secret"
echo ""

read -p "Nhập GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo -e "${RED}❌ Client ID không được để trống${NC}"
    exit 1
fi

read -p "Nhập GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Client Secret không được để trống${NC}"
    exit 1
fi

read -p "Nhập API Domain (mặc định: api.anhthoxay.com): " API_DOMAIN
API_DOMAIN=${API_DOMAIN:-api.anhthoxay.com}

GOOGLE_REDIRECT_URI="https://${API_DOMAIN}/integrations/google/callback"
echo -e "${GREEN}  ✓ Redirect URI: ${GOOGLE_REDIRECT_URI}${NC}"

# Generate encryption key
echo ""
echo -e "${YELLOW}🔐 Tạo Encryption Key...${NC}"
ENCRYPTION_KEY=$(openssl rand -base64 32)
echo -e "${GREEN}  ✓ Encryption Key đã được tạo${NC}"

echo ""

# ============================================
# Step 3: Store in Secret Manager
# ============================================
echo -e "${YELLOW}🔒 Bước 3: Lưu vào Secret Manager...${NC}"

# Function to create or update secret
create_or_update_secret() {
    local SECRET_NAME=$1
    local SECRET_VALUE=$2
    
    if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
        echo -e "${GREEN}  ✓ Updated secret: ${SECRET_NAME}${NC}"
    else
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --project=$PROJECT_ID
        echo -e "${GREEN}  ✓ Created secret: ${SECRET_NAME}${NC}"
    fi
}

create_or_update_secret "google-client-id" "$GOOGLE_CLIENT_ID"
create_or_update_secret "google-client-secret" "$GOOGLE_CLIENT_SECRET"
create_or_update_secret "encryption-key" "$ENCRYPTION_KEY"

echo ""

# ============================================
# Step 4: Grant permissions to Cloud Run
# ============================================
echo -e "${YELLOW}🔓 Bước 4: Cấp quyền cho Cloud Run...${NC}"

# Get Cloud Run service account
SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
COMPUTE_SA="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com"

for SA in $SERVICE_ACCOUNT $COMPUTE_SA; do
    for SECRET in google-client-id google-client-secret encryption-key; do
        gcloud secrets add-iam-policy-binding $SECRET \
            --member="serviceAccount:${SA}" \
            --role="roles/secretmanager.secretAccessor" \
            --project=$PROJECT_ID \
            --quiet 2>/dev/null || true
    done
done

echo -e "${GREEN}  ✓ Đã cấp quyền truy cập secrets${NC}"
echo ""

# ============================================
# Step 5: Update Cloud Run service
# ============================================
echo -e "${YELLOW}🚀 Bước 5: Cập nhật Cloud Run API service...${NC}"

# Check if API service exists
if gcloud run services describe api --region=asia-southeast1 --project=$PROJECT_ID &>/dev/null; then
    gcloud run services update api \
        --region=asia-southeast1 \
        --project=$PROJECT_ID \
        --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,ENCRYPTION_KEY=encryption-key:latest" \
        --set-env-vars="GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI}" \
        --quiet
    
    echo -e "${GREEN}  ✓ Cloud Run API đã được cập nhật${NC}"
else
    echo -e "${YELLOW}  ⚠ Cloud Run API service chưa tồn tại. Secrets đã được tạo, sẽ được áp dụng khi deploy.${NC}"
fi

echo ""

# ============================================
# Summary
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ HOÀN THÀNH SETUP GOOGLE INTEGRATION    ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Các secrets đã được tạo trong Secret Manager:${NC}"
echo "  - google-client-id"
echo "  - google-client-secret"
echo "  - encryption-key"
echo ""
echo -e "${BLUE}Redirect URI đã cấu hình:${NC}"
echo "  ${GOOGLE_REDIRECT_URI}"
echo ""
echo -e "${YELLOW}⚠️  QUAN TRỌNG:${NC}"
echo "1. Đảm bảo Redirect URI đã được thêm vào Google OAuth Credentials"
echo "2. Vào Admin > Settings > Tích hợp để kết nối Google Sheets"
echo "3. Sau khi kết nối, cấu hình Spreadsheet ID và bật đồng bộ"
echo ""
echo -e "${BLUE}Link quản lý:${NC}"
echo "  - OAuth Credentials: https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
echo "  - Secret Manager: https://console.cloud.google.com/security/secret-manager?project=${PROJECT_ID}"
echo "  - Cloud Run: https://console.cloud.google.com/run?project=${PROJECT_ID}"
echo ""
