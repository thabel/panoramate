# =========================
# BUILD STAGE
# =========================
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit

COPY . .

# Build Next.js (no Prisma generation needed with mysql2)
RUN npm run build


# =========================
# PRODUCTION STAGE
# =========================
FROM node:22-slim AS runner

WORKDIR /app

# NODE_ENV will come from .env file or docker-compose
# Do not hardcode it here

RUN apt-get update && apt-get install -y \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --no-audit --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

RUN mkdir -p /app/uploads

EXPOSE 3000

# Start Next.js production server
CMD ["node_modules/.bin/next", "start"]