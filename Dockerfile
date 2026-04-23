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

# Accept build arguments
ARG DATABASE_URL
ARG JWT_SECRET
ARG NEXTAUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG STRIPE_SECRET_KEY
ARG STRIPE_PUBLISHABLE_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_PRICE_STARTER_MONTHLY
ARG STRIPE_PRICE_PROFESSIONAL_MONTHLY
ARG STRIPE_PRICE_ENTERPRISE_MONTHLY

# Export them for build
ENV DATABASE_URL=$DATABASE_URL \
    JWT_SECRET=$JWT_SECRET \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
    STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY \
    STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET \
    STRIPE_PRICE_STARTER_MONTHLY=$STRIPE_PRICE_STARTER_MONTHLY \
    STRIPE_PRICE_PROFESSIONAL_MONTHLY=$STRIPE_PRICE_PROFESSIONAL_MONTHLY \
    STRIPE_PRICE_ENTERPRISE_MONTHLY=$STRIPE_PRICE_ENTERPRISE_MONTHLY

RUN npx prisma generate
RUN npm run build

# =========================
# PRODUCTION STAGE
# =========================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=development

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