# --- STAGE 1: Build (Tukang Masak) ---
# Gunakan Node v18 (LTS) supaya kompatibel dengan banyak library
FROM node:18-alpine AS builder

WORKDIR /app

# Copy file package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependencies dengan flag '--legacy-peer-deps'
# Ini obat ampuh biar npm gak error kalau ada versi library yang bentrok
RUN npm install --legacy-peer-deps

# Copy seluruh source code frontend
COPY . .

# 🔥 Lakukan Build (Vite akan mengubah TS/React jadi HTML/JS di folder /dist)
RUN npm run build

# --- STAGE 2: Serve dengan Nginx (Penyajian) ---
FROM nginx:alpine

# 1. Hapus config default bawaan Nginx (biar bersih)
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copy config Nginx buatan kita sendiri (nginx.conf)
# Pastikan file nginx.conf SUDAH ADA di folder client kamu
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Copy hasil build React (folder dist) dari Stage 1 ke folder Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 4. Buka port 8080 (Wajib buat Cloud Run)
EXPOSE 8080

# 5. Jalankan Nginx
CMD ["nginx", "-g", "daemon off;"]