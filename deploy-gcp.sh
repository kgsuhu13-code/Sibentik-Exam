#!/bin/bash

# ==========================================
# SIBENTIK EXAM - AUTO DEPLOYMENT SCRIPT (BASH/WSL)
# ==========================================

# Exit on error
set -e

print_title() {
    echo ""
    echo -e "\033[1;36m==========================================\033[0m"
    echo -e "\033[1;36m  $1\033[0m"
    echo -e "\033[1;36m==========================================\033[0m"
    echo ""
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "\033[1;31m❌ $2 tidak ditemukan. Pastikan sudah terinstall.\033[0m"
        exit 1
    fi
}

# 1. Prerequisite Checks
print_title "1. Memeriksa Prasyarat Sistem"
check_command "gcloud" "Google Cloud SDK"
check_command "docker" "Docker"
echo -e "\033[1;32m✅ System checks passed.\033[0m"

# 2. Setup Project & Region
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "\033[1;31m❌ Project ID belum diset. Jalankan 'gcloud config set project [PROJECT_ID]' terlebih dahulu.\033[0m"
    exit 1
fi

REGION="asia-southeast2"
REPO_NAME="cbt-repo"

echo -e "\033[1;33mProject ID: $PROJECT_ID\033[0m"
echo -e "\033[1;33mRegion    : $REGION\033[0m"
echo -e "\033[1;33mRepo Name : $REPO_NAME\033[0m"

# 3. Enable Services & Create Artifact Registry
print_title "2. Menyiapkan Google Cloud Services"
echo "Mengaktifkan Cloud Run & Artifact Registry..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Cek apakah repo sudah ada
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "Membuat Artifact Registry Repository baru..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Sibentik Docker Repo"
else
    echo -e "\033[1;32m✅ Artifact Registry '$REPO_NAME' sudah ada.\033[0m"
fi

# Configure Docker Auth
echo "Mengkonfigurasi Docker auth..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# ==========================================
# BACKEND DEPLOYMENT
# ==========================================
print_title "3. Deploying BACKEND Service"

BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cbt-backend:latest"
BACKEND_SERVICE="cbt-backend"

# Build Backend
echo "🔨 Building Backend Image..."
# Gunakan --platform linux/amd64 agar kompatibel dengan Cloud Run (jika develop di Mac M1/M2)
docker build --platform linux/amd64 -t $BACKEND_IMAGE ./server

# Push Backend
echo "⬆️ Pushing Backend Image ke Artifact Registry..."
docker push $BACKEND_IMAGE

# Deploy Backend to Cloud Run
echo "🚀 Deploying Backend ke Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
    --image $BACKEND_IMAGE \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --min-instances 0 \
    --max-instances 10 \
    --cpu 1 \
    --memory 512Mi \
    --port 8080 \
    --execution-environment gen2

# Get Backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)')
echo -e "\033[1;32m✅ Backend Deployed Successfully!\033[0m"
echo -e "\033[1;32m🔗 Backend URL: $BACKEND_URL\033[0m"


print_title "🎉 DEPLOYMENT SELESAI!"
echo -e "\033[1;32m✅ Backend Updated and deployed to:\033[0m"
echo -e "\033[1;32m🔗 $BACKEND_URL\033[0m"
echo ""
echo -e "\033[1;33mCatatan:\033[0m"
echo -e "\033[1;33mJika Anda mengubah variabel environment, update juga di Cloud Run Console.\033[0m"

