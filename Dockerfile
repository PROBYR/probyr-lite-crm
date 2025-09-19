# Multi-stage build for ProByr Lite CRM (Express.js + React)
FROM node:18-alpine AS base

# Install dependencies for backend
FROM base AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --only=production

# Install dependencies for frontend
FROM base AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --only=production

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 probyr

# Install curl for health checks
RUN apk add --no-cache curl

# Copy backend production dependencies
COPY --from=backend-deps --chown=probyr:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=probyr:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=probyr:nodejs /app/backend/package*.json ./backend/
COPY --from=backend-builder --chown=probyr:nodejs /app/backend/migrations ./backend/migrations

# Copy built frontend to be served by Express
COPY --from=frontend-builder --chown=probyr:nodejs /app/frontend/dist ./frontend/dist

# Switch to non-root user
USER probyr

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the Express.js application
CMD ["npm", "start"]