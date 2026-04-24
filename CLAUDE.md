# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panoramate** is a full-stack Next.js SaaS application for creating and sharing immersive 360° virtual tours. Users upload equirectangular panoramic images, add interactive hotspots (links, info boxes, videos), and share tours via public links.

**Key Technologies:**
- Next.js 14 (App Router), React 18, TypeScript
- MySQL + mysql2 (raw SQL, no ORM)
- Tailwind CSS + Lucide React icons
- JWT authentication (jose + bcryptjs)
- Stripe for subscription management
- Marzipano (CDN) for 360° viewer
- Multer + Sharp for image upload/processing

## Common Development Commands

### Getting Started
```bash
npm install                    # Install dependencies
cp .env.example .env.local    # Setup environment
npm run dev                    # Start dev server (http://localhost:3000)
```

### Building & Production
```bash
npm run build                 # Build for production
npm start                     # Start production server
```

### Running Single API Endpoints
```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@panoramate.com","password":"Demo1234!"}'

curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

curl -X GET http://localhost:3000/api/tours \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Docker Setup

### Running with Docker
All Docker commands require `--env-file .env.local` — the project uses `.env.local`, not `.env`:

```bash
# Start all services (builds image on first run)
docker compose --env-file .env.local up

# Rebuild image after code changes
docker compose --env-file .env.local up --build

# Full rebuild from scratch (no cache)
docker compose --env-file .env.local build --no-cache && docker compose --env-file .env.local up

# Stop containers (keeps data volumes)
docker compose --env-file .env.local down

# Stop and wipe everything including the database
docker compose --env-file .env.local down -v
```

### Services
- **app** — Next.js on `http://localhost:3000`
- **db** — MySQL 8 (internal port 3306)
- **mailhog** — Email testing UI on `http://localhost:1080`, SMTP on port 1025

### Required `.env.local` variables
```
# App
JWT_SECRET=<min 32 chars>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (used by the app via mysql2)
DATABASE_HOST=localhost        # use "db" only when running outside Docker
DATABASE_PORT=3306
DATABASE_NAME=panoramate
DATABASE_USER=
DATABASE_PASSWORD=

# MySQL container init (Docker only)
DB_ROOT_PASSWORD=

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...

# Email (optional)
MAILHOG_WEB_PORT=1080
MAILHOG_SMTP_PORT=1025
APP_PORT=3000
```

Note: `DATABASE_HOST` is hardcoded to `db` in docker-compose — the value from `.env.local` is ignored for Docker. This is intentional so local dev (`localhost`) and Docker (`db`) don't conflict.

### How the Docker build works
Three stages:
1. **base** — shared OS layer (openssl, ca-certificates)
2. **builder** — installs all deps, compiles Next.js into `.next/standalone`
3. **runner** — copies only the standalone output, no source code, no devDependencies

Dummy `JWT_SECRET` and `STRIPE_SECRET_KEY` are used at build time to satisfy module-level validation that runs during `npm run build`. Real values are injected at runtime by docker-compose.

### `.env.local` line endings
Must use **LF** not CRLF. Windows CRLF causes Docker to pass `value\r` to containers which MySQL rejects. In VS Code, check the bottom-right corner — click CRLF and switch to LF if needed. Or fix with:
```bash
sed -i 's/\r//' .env.local
```

## Architecture Overview

### High-Level Structure
```
Client (React)
  ↓ (HTTP)
Next.js API Routes (/api/*)
  ↓
Middleware (JWT validation)
  ↓
Route Handlers
  ↓
mysql2 connection pool (src/lib/db.ts)
  ↓
MySQL Database
```

### Directory Structure
```
src/
├── app/
│   ├── (auth)/                       # Public auth pages
│   │   ├── page.tsx                  # Login
│   │   └── register/page.tsx
│   ├── (dashboard)/                  # Protected routes
│   │   ├── dashboard/page.tsx
│   │   ├── tours/page.tsx
│   │   ├── tours/[id]/editor/page.tsx
│   │   ├── billing/page.tsx
│   │   ├── team/page.tsx
│   │   └── settings/page.tsx
│   ├── tour/[shareToken]/page.tsx    # Public viewer (no auth)
│   ├── api/                          # 20 API endpoints
│   │   ├── auth/
│   │   ├── tours/
│   │   ├── tours-public/
│   │   ├── billing/
│   │   └── team/
│   ├── layout.tsx                    # Root layout (Marzipano CDN)
│   ├── globals.css
│   └── middleware.ts
│
├── components/
│   ├── dashboard/
│   │   ├── ShareModal.tsx
│   │   ├── TourCard.tsx
│   │   └── UploadZone.tsx
│   ├── ui/
│   │   ├── Alert.tsx, Badge.tsx, Button.tsx, Input.tsx, Modal.tsx
│   │   └── LoadingSpinner.tsx, StatsCard.tsx, UsageBar.tsx
│   └── viewer/
│       └── MarzipanoViewer.tsx
│
├── hooks/
│   ├── useAuth.ts
│   └── useTours.ts                   # React Query data fetching
│
├── lib/
│   ├── auth.ts                       # JWT (lazy key init — do not move validation to module level)
│   ├── db.ts                         # mysql2 connection pool
│   ├── stripe.ts                     # Stripe (lazy init — do not move validation to module level)
│   ├── storage.ts
│   └── logger.ts                     # Pino
│
└── types/
    └── index.ts

public/
uploads/                              # User uploads (Docker volume in production)
```

### Database
Raw SQL via `mysql2/promise`. The `db` object in `src/lib/db.ts` exposes:
- `db.query(sql, values)` — returns all rows
- `db.queryOne(sql, values)` — returns first row or null
- `db.execute(sql, values)` — for INSERT/UPDATE/DELETE
- `db.transaction(callback)` — wraps in BEGIN/COMMIT/ROLLBACK

### Key Architectural Patterns

**Authentication:**
- JWT (jose, HS256), 7-day expiration
- `JWT_SECRET` validated lazily in `auth.ts` via `getKey()` — only runs on first request, not at import time. Do not revert this to module-level validation or Docker builds will fail.
- Roles: OWNER, ADMIN, MEMBER, VIEWER

**Stripe:**
- `stripe.ts` exports a `stripe` proxy object and a `getStripe()` function
- Client is lazily initialized — `STRIPE_SECRET_KEY` validated only on first call
- Do not revert to module-level instantiation or Docker builds will fail

**File Storage:**
- `./uploads/{organizationId}/{tourId}/{filename}`
- Sharp processes image dimensions
- Storage tracked per Organization

**Real-Time Data:**
- TanStack React Query, refetches on window focus

**Payments:**
- Stripe webhook: `/api/billing/webhook`
- Events: checkout.session.completed, customer.subscription.*, invoice.*

### API Endpoints (20 total)
- **Auth (4):** register, login, logout, me
- **Tours (5):** list, create, read, update, delete
- **Images (2):** upload, delete
- **Hotspots (3):** list, create, update/delete
- **Sharing (3):** share info, create link, revoke
- **Billing (4):** plans, subscribe, portal, invoices
- **Team (4):** list, invite, update role, remove
- **Files (2):** logo upload, audio upload

### Middleware (src/middleware.ts)
- Protects: `/dashboard/*`, `/tours/*`, `/billing/*`, `/team/*`
- Public: `/api/auth/*`, `/api/tours-public/*`, `/tour/*`
- JWT from cookie or Authorization header

## Development Notes
- **Node.js:** 18+ required
- **Marzipano:** CDN only (not an npm package)
- **No ORM:** Raw SQL with mysql2. Schema changes require manual SQL migrations.
- **No linting:** Consider ESLint + Prettier
- **No tests:** Consider Jest/Vitest
