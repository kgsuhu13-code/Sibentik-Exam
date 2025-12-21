#!/bin/bash
set -e

# ==========================================
# SIBENTIK EXAM - FIREBASE FRONTEND DEPLOY
# ==========================================

print_title() {
    echo ""
    echo -e "\033[1;36m==========================================\033[0m"
    echo -e "\033[1;36m  $1\033[0m"
    echo -e "\033[1;36m==========================================\033[0m"
    echo ""
}

# 1. Cek Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Belum login gcloud atau project belum diset. Silakan jalankan 'gcloud init' atau masukkan PROJECT_ID manual."
    read -p "Masukkan Google Cloud Project ID Anda: " PROJECT_ID
fi
echo -e "\033[1;33mUsing Project ID: $PROJECT_ID\033[0m"

# 2. Buat konfigurasi Firebase otomatis
print_title "1. Konfigurasi Project Firebase"

# Buat .firebaserc
cat > .firebaserc <<EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF
echo "✅ Berhasil membuat .firebaserc"

# Buat firebase.json (SPA Configuration)
cat > firebase.json <<EOF
{
  "hosting": {
    "public": "client/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
EOF
echo "✅ Berhasil membuat firebase.json (untuk Single Page App)"

# 3. Build React App
print_title "2. Build Frontend"

# Ambil URL Backend otomatis jika bisa, atau minta input
BACKEND_URL=$(gcloud run services describe cbt-backend --region asia-southeast2 --format 'value(status.url)' 2>/dev/null || true)

if [ -z "$BACKEND_URL" ]; then
    echo -e "\033[1;33mGagal mengambil URL Backend otomatis.\033[0m"
    echo -e "Silakan masukkan URL Backend Cloud Run Anda (contoh: https://cbt-backend-xxx.a.run.app)"
    read -p "URL Backend: " BACKEND_URL
else
    echo -e "\033[1;32mDitemukan Backend URL: $BACKEND_URL\033[0m"
fi

# Pastikan URL bersih dari trailing slash
BACKEND_URL=${BACKEND_URL%/}

echo "🔨 Building Client..."
echo "Injecting Environment: VITE_API_BASE_URL=$BACKEND_URL/api"

cd client
# Install dependencies dulu just in case
if [ ! -d "node_modules" ]; then
    echo "📦 Installing request dependencies..."
    npm install
fi

# Set env var dan build
export VITE_API_BASE_URL="$BACKEND_URL/api"
npm run build
cd ..

# 4. Deploy to Firebase
print_title "3. Deploying ke Firebase Hosting"
echo "🚀 Uploading files..."
npx --yes firebase-tools@13.29.1 deploy --only hosting

print_title "🎉 SELESAI!"
echo "Silakan buka URL Hosting yang muncul di atas."
echo "Langkah selanjutnya: Tambahkan Custom Domain 'sibentikexam.id' di Firebase Console."
