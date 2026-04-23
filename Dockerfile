# ─────────────────────────────────────────
# BASE
# ─────────────────────────────────────────
FROM node:22-slim AS base

RUN apt-get update && apt-get install -y openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*


# ─────────────────────────────────────────
# BUILDER
# ─────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit

COPY . .

# Dummy vars satisfy module-level validation that runs during Next.js build.
# Real values are injected at runtime by docker-compose.
RUN JWT_SECRET="dummy-secret-for-build-only-32-chars!!" \
    STRIPE_SECRET_KEY="sk_test_dummy" \
    npm run build


# ─────────────────────────────────────────
# RUNNER
# ─────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Standalone output bundles the server and its traced dependencies.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p /app/uploads

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
