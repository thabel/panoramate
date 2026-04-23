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

# Accept build arguments for environment variables needed for build
ARG DATABASE_URL="mysql://bativy:bativy@db:3306/bativy"
ARG JWT_SECRET="your-super-secret-jwt-key-must-be-at-least-32-characters-long!!"
ARG NEXTAUTH_URL="http://localhost:3000"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG STRIPE_SECRET_KEY="sk_test_51234567890123456789012345"
ARG STRIPE_PUBLISHABLE_KEY="pk_test_51234567890123456789012345"
ARG STRIPE_WEBHOOK_SECRET="whsec_1234567890123456789012345"
ARG STRIPE_PRICE_STARTER_MONTHLY="price_1234567890"
ARG STRIPE_PRICE_PROFESSIONAL_MONTHLY="price_0987654321"
ARG STRIPE_PRICE_ENTERPRISE_MONTHLY="price_5555555555"

# Export as environment variables for build steps
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