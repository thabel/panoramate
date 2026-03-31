# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Panoramate** is a full-stack Next.js SaaS application for creating and sharing immersive 360° virtual tours. Users upload equirectangular panoramic images, add interactive hotspots (links, info boxes, videos), and share tours via public links.

**Key Technologies:**
- Next.js 14 (App Router), React 18, TypeScript
- MySQL + Prisma ORM
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

### Database Operations
```bash
npm run db:push               # Push schema changes to database
npm run db:migrate            # Create database migration
npm run db:seed               # Seed database with demo data
npm run db:studio             # Open Prisma Studio (visual DB manager)
npm run db:create-test-user   # Create test user (demo@panoramate.com / Demo1234!)
```

### Building & Production
```bash
npm run build                 # Build for production
npm start                     # Start production server
```

### Running Single API Endpoints
To test individual API routes, use curl or your REST client:
```bash
# Authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@panoramate.com","password":"Demo1234!"}'

# Get current user (requires auth token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List tours
curl -X GET http://localhost:3000/api/tours \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Architecture Overview

### High-Level Structure

**Multi-Tenant SaaS Architecture:**
```
Client (React)
  ↓ (HTTP)
Next.js API Routes (/api/*)
  ↓
Middleware (JWT validation, auth checks)
  ↓
Route Handlers (business logic)
  ↓
Prisma ORM
  ↓
MySQL Database
```

### Directory Structure

```
src/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Public auth pages (layout group)
│   │   ├── page.tsx                  # Login page
│   │   └── register/page.tsx         # Register page
│   ├── (dashboard)/                  # Protected routes (layout group)
│   │   ├── dashboard/page.tsx        # Main dashboard
│   │   ├── tours/page.tsx            # Tours list
│   │   ├── tours/[id]/editor/page.tsx # Tour editor (hotspots, images)
│   │   ├── billing/page.tsx          # Subscription management
│   │   ├── team/page.tsx             # Team members
│   │   └── settings/page.tsx         # Account settings
│   ├── tour/[shareToken]/page.tsx    # Public tour viewer (no auth needed)
│   ├── api/                          # API routes (20 endpoints)
│   │   ├── auth/                     # Authentication endpoints
│   │   ├── tours/                    # Tour CRUD & images/hotspots
│   │   ├── tours-public/             # Public tour access
│   │   ├── billing/                  # Stripe integration
│   │   └── team/                     # Team member management
│   ├── layout.tsx                    # Root layout (Marzipano CDN script)
│   ├── globals.css                   # Global styles
│   └── middleware.ts                 # Auth middleware
│
├── components/
│   ├── dashboard/                    # Dashboard-specific UI
│   │   ├── ShareModal.tsx            # Tour sharing dialog
│   │   ├── TourCard.tsx              # Tour display card
│   │   └── UploadZone.tsx            # File upload
│   ├── ui/                           # Reusable UI components
│   │   ├── Alert.tsx, Badge.tsx, Button.tsx, Input.tsx, Modal.tsx
│   │   ├── LoadingSpinner.tsx, StatsCard.tsx, UsageBar.tsx
│   └── viewer/
│       └── MarzipanoViewer.tsx       # 360° viewer wrapper
│
├── hooks/
│   ├── useAuth.ts                    # Authentication hook
│   └── useTours.ts                   # Tours data fetching/caching (React Query)
│
├── lib/
│   ├── auth.ts                       # JWT signing, password hashing
│   ├── db.ts                         # Prisma client singleton
│   ├── stripe.ts                     # Stripe config & plan limits
│   ├── storage.ts                    # File upload/download, image processing
│   └── logger.ts                     # Pino logging utility
│
└── types/
    └── index.ts                      # All TypeScript type definitions

prisma/
├── schema.prisma                     # Database schema (9 models)
├── seed.ts                           # Demo data seeding
├── create-test-user.ts               # Test user creation script
└── migrations/                       # Database version history

public/                               # Static assets
uploads/                              # User-uploaded images (local filesystem)
```

### Database Schema

The Prisma schema defines 9 core models:

1. **Organization** - Multi-tenant container
   - Subscription plan (FREE_TRIAL, STARTER, PROFESSIONAL, ENTERPRISE)
   - Stripe integration (customerId, subscriptionId)
   - Storage quotas (maxTours, totalStorageMb, usedStorageMb)

2. **User** - Team members
   - Role-based access (OWNER, ADMIN, MEMBER, VIEWER)
   - Email + bcryptjs password
   - Belongs to exactly one Organization

3. **Session** - JWT token tracking
   - Stores issued tokens with expiration
   - IP address & user agent for security

4. **Tour** - Virtual tour container
   - Status: DRAFT, PUBLISHED, ARCHIVED
   - shareToken for public access
   - customLogoUrl & backgroundAudioUrl for branding

5. **TourImage** - Equirectangular panoramic images
   - Dimensions & file size
   - Initial viewer position (yaw, pitch, fov)
   - Ordered sequence within tour

6. **Hotspot** - Interactive elements on images
   - Types: LINK, INFO, URL, VIDEO
   - Position data (yaw, pitch, rotation)
   - Links to other TourImages or external URLs

7. **Plan** - Subscription tier definitions
   - Feature lists (stored as JSON)
   - Stripe price IDs

8. **Invoice** - Payment history

9. **Invitation** - Team member invitations
   - Token-based acceptance
   - Role assignment

### Key Architectural Patterns

**Authentication & Authorization:**
- JWT-based (jose library with HS256)
- 7-day token expiration
- Middleware validation on protected routes
- Roles: OWNER, ADMIN, MEMBER, VIEWER

**File Storage:**
- Location: `./uploads/{organizationId}/{tourId}/{filename}`
- Image processing: Sharp for dimensions/optimization
- Size limits: Configurable via MAX_FILE_SIZE_MB (default 100MB)

**Real-Time Data Sync:**
- TanStack React Query for client-side caching
- Automatic refetching on window focus
- Optimistic updates for UI responsiveness

**Payment Processing:**
- Stripe webhook endpoint: `/api/billing/webhook`
- Handles: checkout.session.completed, customer.subscription.*, invoice.*
- Plan limits enforced per subscription tier

### API Endpoint Categories

**20 Total API Routes:**
- **Auth (4):** register, login, logout, me
- **Tours (5):** list, create, read, update, delete
- **Images (2):** upload, delete
- **Hotspots (3):** list, create, update/delete
- **Sharing (3):** get share info, create link, revoke link, view public
- **Billing (4):** list plans, subscribe, portal, invoices
- **Team (4):** list members, invite, update role, remove, accept invite
- **Files (2):** logo upload, audio upload

### Important Implementation Details

**Middleware (src/middleware.ts):**
- Protects dashboard routes: `/dashboard/*`, `/tours/*`, `/billing/*`, `/team/*`
- Skips protection for: `/api/auth/*`, `/api/tours-public/*`, `/tour/*`
- Validates JWT tokens from cookies or Authorization header
- Redirects unauthenticated users to login

**Storage Handling (src/lib/storage.ts):**
- Images saved with UUID filenames to prevent collisions
- Sharp processes images to extract dimensions
- Storage usage tracked in Organization model
- Files physically deleted when tours/images removed

**Error Handling Pattern:**
```typescript
// Common response format in API routes
if (!resource) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

try {
  // operation
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

**Type Safety:**
- All API requests/responses typed in `src/types/index.ts`
- Prisma types auto-generated from schema
- Path aliases configured: @/app, @/components, @/lib, @/hooks, @/types, @/utils

## Environment Configuration

**Required Variables (.env.local):**
```
DATABASE_URL=mysql://user:password@localhost:3306/panoramate
JWT_SECRET=<min 32 chars>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
```

**Optional Variables:**
```
NEXT_PUBLIC_APP_URL=http://localhost:3000 (default: http://localhost:3000)
NODE_ENV=development
UPLOAD_DIR=./uploads (default)
MAX_FILE_SIZE_MB=100 (default)
```

## Testing Database

Use the seeded demo account:
- **Email:** demo@panoramate.com
- **Password:** Demo1234!
- **Organization:** Demo Org

Or create a new test user:
```bash
npm run db:create-test-user
```

## Common Tasks & Patterns

### Adding a New API Endpoint

1. Create route file: `src/app/api/[resource]/route.ts`
2. Import Prisma client: `import { db } from '@/lib/db';`
3. Validate auth: Get user from request headers/middleware context
4. Query database with Prisma
5. Return NextResponse.json()

### Adding a New Page/Component

1. Create page: `src/app/(dashboard)/feature/page.tsx` (protected) or `src/app/public/page.tsx`
2. Use useAuth hook for authentication in client components
3. Use useTours hook for data fetching with React Query
4. Import UI components from `@/components/ui`
5. Protect routes via middleware.ts for server-side

### Updating Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate -- --name descriptive_name`
3. Migration files auto-generated in `prisma/migrations/`
4. Test with `npm run db:seed` to rebuild with demo data

### File Upload Flow

1. Frontend sends multipart/form-data to `/api/tours/:id/images`
2. Multer middleware parses file
3. Sharp processes image dimensions
4. Save file to `./uploads/{orgId}/{tourId}/{uuid}`
5. Create TourImage record with path & dimensions
6. Track storage usage in Organization

## Development Notes

- **Node.js:** 18+ required
- **Database:** MySQL 8+ required locally
- **Marzipano:** Loaded from CDN in layout.tsx (not npm package)
- **Deployment:** Ready for Vercel or manual Node.js hosting
- **No automated linting:** Consider adding ESLint + Prettier
- **No test framework:** Consider adding Jest/Vitest + React Testing Library
- **Current Branch:** feat/claude_help_improving (merge target: feat/improve_addhotspot)
