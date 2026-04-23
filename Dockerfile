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

RUN npx prisma generate
RUN npm run build


# =========================
# PRODUCTION STAGE
# =========================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

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

CMD ["npm", "start"]