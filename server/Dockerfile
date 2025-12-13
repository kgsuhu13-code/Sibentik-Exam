# --- STAGE 1: Build (Tukang Masak) ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json dulu
COPY package*.json ./

# Install SEMUA dependencies (termasuk typescript)
RUN npm install

# Copy seluruh kodingan kamu
COPY . .

# 🔥 Lakukan Build (Mengubah TS jadi JS ke folder /dist)
RUN npm run build

# --- STAGE 2: Production (Penyajian) ---
FROM node:22-alpine

WORKDIR /app

# Copy package.json lagi
COPY package*.json ./

# Install HANYA dependencies produksi (biar ringan)
RUN npm install --production

# 🚚 Ambil hasil build (folder dist) dari Stage 1
COPY --from=builder /app/dist ./dist

# Expose port 8080
EXPOSE 8080

# Jalankan aplikasi
CMD ["npm", "start"]