#!/bin/bash

# ==========================================
# SIBENTIK EXAM - FRONTEND DEPLOY ONLY
# ==========================================
set -e

print_title() {
    echo ""
    echo -e "\033[1;36m==========================================\033[0m"
    echo -e "\033[1;36m  $1\033[0m"
    echo -e "\033[1;36m==========================================\033[0m"
    echo ""
}

# Minta input URL Backend dari user
echo -e "\033[1;33mMasukkan URL Backend Cloud Run yang sudah aktif:\033[0m"
echo -e "(Contoh: https://cbt-backend-xyz.a.run.app)"
read -p "URL Backend: " BACKEND_URL

# Hapus trailing slash jika ada (misal .app/ jadi .app)
BACKEND_URL=${BACKEND_URL%/}

echo -e "\033[1;32mMenggunakan Backend URL: $BACKEND_URL\033[0m"

# Setup variabel
PROJECT_ID=$(gcloud config get-value project)
REGION="asia-southeast2"
REPO_NAME="cbt-repo"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cbt-frontend:latest"
FRONTEND_SERVICE="cbt-frontend"

print_title "Deploying FRONTEND Service..."

# Build Frontend (Inject Backend URL)
echo "🔨 Building Frontend Image..."
echo -e "\033[1;33mInjecting VITE_API_BASE_URL=$BACKEND_URL/api\033[0m"

# Build dengan ARG
docker build --platform linux/amd64 \
    --build-arg VITE_API_BASE_URL="$BACKEND_URL/api" \
    -t $FRONTEND_IMAGE ./client

# Push Frontend
echo "⬆️ Pushing Frontend Image..."
docker push $FRONTEND_IMAGE

# Deploy Frontend to Cloud Run
echo "🚀 Deploying Frontend ke Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE \
    --image $FRONTEND_IMAGE \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --cpu 1 \
    --memory 512Mi \
    --port 8080 \
    --execution-environment gen2

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)')

print_title "🎉 DEPLOYMENT SELESAI!"
echo -e "\033[1;32mWebsite Anda sudah live di:\033[0m"
echo -e "\033[1;32m🌍 $FRONTEND_URL\033[0m"
