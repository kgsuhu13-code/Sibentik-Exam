# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client

# Copy packages first for caching
COPY client/package*.json ./
RUN npm install

# Copy source and build
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend & Setup Production Server
FROM node:18-alpine
WORKDIR /app

# Copy backend requirements
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy backend source
COPY server/ ./

# Build backend (Typescript -> Javascript)
RUN npm run build

# Create 'public' folder and copy built frontend assets from Stage 1
RUN mkdir -p public
COPY --from=frontend-builder /app/client/dist ./public

# Environment set for production
ENV NODE_ENV=production
ENV PORT=8080

# Expose port 8080 (Google Cloud Run default)
EXPOSE 8080

# Start server
CMD ["npm", "start"]
