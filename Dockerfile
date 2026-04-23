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

# Only pass DATABASE_URL which is required for prisma generate
# Runtime config comes from .env file via docker-compose
ARG DATABASE_URL="mysql://user:password@db:3306/db"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
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
RUN npm ci --no-audit

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.js ./next.config.js

RUN mkdir -p /app/uploads

EXPOSE 3000

# Start based on NODE_ENV from runtime
CMD ["node_modules/.bin/next", "start"]