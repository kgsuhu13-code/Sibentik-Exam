
# ==========================================
# SIBENTIK EXAM - AUTO DEPLOYMENT SCRIPT
# ==========================================
$ErrorActionPreference = "Stop"

function Print-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Check-Command {
    param([string]$Command, [string]$Name)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Error "$Name tidak ditemukan. Pastikan sudah terinstall dan masuk PATH."
    }
}

# 1. Prerequisite Checks
Print-Title "1. Memeriksa Prasyarat Sistem"
Check-Command "gcloud" "Google Cloud SDK"
Check-Command "docker" "Docker"
Write-Host "System checks passed." -ForegroundColor Green

# 2. Setup Project & Region
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Error "Project ID belum diset. Jalankan 'gcloud config set project [PROJECT_ID]' terlebih dahulu."
}
$REGION = "asia-southeast2"
$REPO_NAME = "cbt-repo"

Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region    : $REGION" -ForegroundColor Yellow
Write-Host "Repo Name : $REPO_NAME" -ForegroundColor Yellow

# 3. Enable Services & Create Artifact Registry
Print-Title "2. Menyiapkan Google Cloud Services"
Write-Host "Mengaktifkan Cloud Run & Artifact Registry..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Cek apakah repo sudah ada
$RepoCheck = gcloud artifacts repositories describe $REPO_NAME --location=$REGION 2>$null
if (-not $RepoCheck) {
    Write-Host "Membuat Artifact Registry Repository barru..."
    gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="Sibentik Docker Repo"
} else {
    Write-Host "Artifact Registry '$REPO_NAME' sudah ada." -ForegroundColor Green
}

# Configure Docker Auth
Write-Host "Mengkonfigurasi Docker auth..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# ==========================================
# BACKEND DEPLOYMENT
# ==========================================
Print-Title "3. Deploying BACKEND Service"

$BACKEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cbt-backend:latest"
$BACKEND_SERVICE = "cbt-backend"

# Build Backend
Write-Host "Building Backend Image..."
docker build -t $BACKEND_IMAGE ./server

# Push Backend
Write-Host "Pushing Backend Image..."
docker push $BACKEND_IMAGE

# Deploy Backend to Cloud Run
Write-Host "Deploying Backend ke Cloud Run..."
gcloud run deploy $BACKEND_SERVICE `
    --image $BACKEND_IMAGE `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 10 `
    --cpu 1 `
    --memory 512Mi `
    --port 8080 `
    --execution-environment gen2

# Get Backend URL
$BACKEND_URL = gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)'
Write-Host "Backend Deployed Successfully!" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Green

# ==========================================
# FRONTEND DEPLOYMENT
# ==========================================
Print-Title "4. Deploying FRONTEND Service"

$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/cbt-frontend:latest"
$FRONTEND_SERVICE = "cbt-frontend"

# Build Frontend (Inject Backend URL)
Write-Host "Building Frontend Image..."
Write-Host "Injecting VITE_API_BASE_URL=$BACKEND_URL/api" -ForegroundColor Yellow

# GANTI INI: Gunakan tanda kutip yang aman
$API_URL = "$BACKEND_URL/api"
docker build --build-arg VITE_API_BASE_URL=$API_URL -t $FRONTEND_IMAGE ./client

# Push Frontend
Write-Host "Pushing Frontend Image..."
docker push $FRONTEND_IMAGE

# Deploy Frontend to Cloud Run
Write-Host "Deploying Frontend ke Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE `
    --image $FRONTEND_IMAGE `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --min-instances 0 `
    --max-instances 50 `
    --cpu 1 `
    --memory 512Mi `
    --port 8080 `
    --execution-environment gen2

$FRONTEND_URL = gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)'

Print-Title "DEPLOYMENT SELESAI!"
Write-Host "Website Anda sudah live di:" -ForegroundColor Green
Write-Host "$FRONTEND_URL" -ForegroundColor Green
Write-Host ""
Write-Host "Catatan Penting:" -ForegroundColor Yellow
Write-Host "1. Buka Cloud Run Console: https://console.cloud.google.com/run"
Write-Host "2. Pilih service 'cbt-backend'"
Write-Host "3. Masuk ke tab 'Edit & Deploy New Revision' -> 'Variables & Secrets'"
Write-Host "4. Tambahkan Environment Variable: DATABASE_URL, REDIS_URL, JWT_SECRET, GEMINI_API_KEY"
Write-Host "5. Klik Deploy."
