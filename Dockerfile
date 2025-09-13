# Multi-stage build for Probyr Lite CRM
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build the frontend
WORKDIR /app/frontend
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 encore

# Copy built application
COPY --from=builder --chown=encore:nodejs /app/backend ./backend
COPY --from=builder --chown=encore:nodejs /app/frontend/dist ./backend/frontend/dist

# Install Encore CLI
RUN npm install -g @encore/cli

# Switch to non-root user
USER encore

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["encore", "run"]