# RBAC Quick Reference Card

## Role Hierarchy

```
OWNER (Organization Creator)
├─ Created during registration
├─ Can invite MEMBER/VIEWER
├─ Can manage team members
├─ NOT exempt from plan limits
└─ Permission inheritance: Full access (due to disabled checks)

ADMIN (Administrator)
├─ Assigned by OWNER via invitation
├─ CANNOT invite members (blocked)
├─ Can manage team members
├─ EXEMPT from plan limits (unlimited tours/images/storage)
├─ Access admin dashboard
├─ Approve/reject inscription requests
└─ Full system access except invitations

MEMBER (Team Member)
├─ Default invitation role
├─ Can invite other members
├─ CANNOT manage team members
├─ Subject to plan limits
└─ Can create tours/images/hotspots

VIEWER (Read-Only)
├─ Can be assigned via invitation
├─ Cannot invite
├─ Cannot manage anything
├─ Subject to plan limits
└─ Role defined but NOT enforced (can do same as MEMBER)
```

## Permission Matrix at a Glance

| Operation | OWNER | ADMIN | MEMBER | VIEWER | Notes |
|-----------|-------|-------|--------|--------|-------|
| Create Tour | YES | YES* | YES* | NO | *ADMIN exempt from limits |
| View Tour | YES* | YES* | YES* | YES* | *All can view any tour |
| Edit Tour | YES* | YES* | YES* | NO | *All can edit any tour |
| Delete Tour | YES* | YES* | YES* | NO | *All can delete any tour |
| Upload Image | YES | YES* | YES* | NO | *ADMIN exempt from limits |
| Delete Image | YES* | YES* | YES* | NO | *All can delete any image |
| Create Hotspot | YES* | YES* | YES* | NO | *All can create |
| Invite Member | YES | NO | YES | NO | ADMIN specifically blocked |
| Update Role | YES | NO | NO | NO | Can change member roles |
| Remove Member | YES | NO | NO | NO | Can delete members |
| Access Admin | NO | YES | NO | NO | ADMIN only |
| Approve Requests | NO | YES | NO | NO | ADMIN only |

`*` = Feature implemented but permission not enforced in code

## Plan Limits

| Plan | Tours | Images/Tour | Storage | Trial | Cost |
|------|-------|-------------|---------|-------|------|
| FREE_TRIAL | 1 | 10 | 500 MB | 14 days | Free |
| STARTER | 5 | 50 | 2 GB | - | $29/mo |
| PROFESSIONAL | 20 | 200 | 10 GB | - | $79/mo |
| ENTERPRISE | Unlimited | Unlimited | 100 GB | - | $199/mo |

**ADMIN exemption applies to all limits**

## File Locations (Key References)

### Schema & Types
- Roles definition: `prisma/schema.prisma:214-219`
- Types: `src/types/index.ts`

### Authentication
- JWT logic: `src/lib/auth.ts`
- Middleware: `src/middleware.ts`

### Authorization
- Plan limits: `src/lib/plan-limits.ts`
- Stripe config: `src/lib/stripe.ts`

### API Routes - Tours
- List/Create: `src/app/api/tours/route.ts`
- Read/Update/Delete: `src/app/api/tours/[id]/route.ts`
- Images: `src/app/api/tours/[id]/images/route.ts`
- Hotspots: `src/app/api/tours/[id]/images/[imageId]/hotspots/route.ts`

### API Routes - Team
- List/Invite: `src/app/api/team/route.ts`
- Update/Remove: `src/app/api/team/[memberId]/route.ts`
- Accept Invite: `src/app/api/team/accept-invite/route.ts`

### API Routes - Admin
- Dashboard: `src/app/(dashboard)/admin/inscriptions/page.tsx`
- List Requests: `src/app/api/admin/inscriptions/route.ts`
- Approve: `src/app/api/inscription-request/[id]/approve/route.ts`

### Registration
- Register page: `src/app/(auth)/register/page.tsx`
- API: `src/app/api/auth/register/route.ts`
- Inscription: `src/app/(request-inscription)/request-inscription/page.tsx`

## Key Findings

### What Works
✓ JWT Authentication (7-day tokens)
✓ Admin dashboard access control
✓ Plan limit enforcement
✓ ADMIN exemption system
✓ Invitation-based onboarding
✓ Trial expiration checks

### What's Broken/Disabled
✗ Tour/image/hotspot ownership checks (DISABLED)
✗ Organization data isolation (DISABLED)
✗ VIEWER role enforcement (NOT enforced)
✗ Auto-creation on inscription approval (MISSING)
✗ ADMIN can't invite members (BLOCKED)

### Security Issues
1. **CRITICAL:** All authenticated users can modify any tour/image/hotspot
2. **CRITICAL:** Organization data not properly isolated
3. **HIGH:** No audit trail for ADMIN actions
4. **MEDIUM:** Inscription workflow incomplete

## Code Comments Indicating Intentional Disabling

```
"RESTRICTION DISABLED: all authenticated users can access all tours"
"RESTRICTION DISABLED: all authenticated users can access all tours"
"RESTRICTION DISABLED: all authenticated users can create hotspots"
"RESTRICTION DISABLED: organization check removed, owner protection removed"
```

These appear in:
- `/api/tours/[id]/route.ts` (lines 43, 78, 138)
- `/api/tours/[id]/images/route.ts` (lines 177, 241)
- `/api/tours/[id]/images/[imageId]/hotspots/route.ts` (lines 34, 120, 243, 321)
- `/api/team/[memberId]/route.ts` (lines 15, 27, 78, 90)
- `/api/team/route.ts` (line 69)

## Invitation Flow

```
Invited User
     ↓
Receives invitation (7-day expiration)
     ↓
POST /api/team/accept-invite
     ↓
User created with invitation.role
     ↓
Invitation marked acceptedAt
     ↓
User can now access dashboard
```

## Inscription Request Flow

```
Public User
     ↓
Visits /register
     ↓
Redirected to /request-inscription
     ↓
Submits inscription request (FREE or PROFESSIONAL)
     ↓
Stored as PENDING in InscriptionRequest table
     ↓
ADMIN reviews in /admin/inscriptions
     ↓
ADMIN clicks Approve
     ↓
Status changed to APPROVED
     ↓
[AUTO-CREATION NOT IMPLEMENTED]
     ↓
Manual user setup required
```

## Environment Variables

Required:
- `JWT_SECRET` (min 32 chars)
- `DATABASE_URL` (MySQL connection)
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe Price IDs for each plan

## Public Routes (No Auth)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/billing/plans`
- `POST /api/inscription-request`
- `GET /api/tours-public/*`
- `GET /tour/:shareToken` (public viewer)

## Protected Routes (Auth Required)

- `/dashboard/*`
- `/admin/*`
- `/tours/*`
- All `/api/` except public ones

## Testing the System

### Test User
Email: `demo@panoramate.com`
Password: `Demo1234!`
Role: OWNER

### Create Test User
```bash
npm run db:create-test-user
```

### Create ADMIN User
1. Login as OWNER
2. Go to `/team`
3. Invite user with role ADMIN
4. Have them accept invitation
5. They now have ADMIN access

### Test Plan Limits
1. Create FREE_TRIAL org (1 tour, 10 images)
2. Create 1 tour
3. Try to create 2nd tour → blocked
4. Assign user ADMIN role
5. Admin can create unlimited tours

## Critical Code Sections

### ADMIN Exemption (src/lib/plan-limits.ts:14-16)
```typescript
export function isExemptFromLimits(authPayload: AuthPayload): boolean {
  return authPayload.role === 'ADMIN';
}
```

### ADMIN Invitation Block (src/app/api/team/route.ts:73-74)
```typescript
if (authPayload.role === 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Disabled Ownership Check (src/app/api/tours/[id]/route.ts:43)
```typescript
// RESTRICTION DISABLED: all authenticated users can access all tours
return NextResponse.json(
  { success: true, data: tour },
  { status: 200 }
);
```

## Recommendations Priority

1. **URGENT**: Add organization scoping to all endpoints
2. **URGENT**: Implement resource ownership verification
3. **IMPORTANT**: Complete inscription auto-creation workflow
4. **IMPORTANT**: Enforce VIEWER role as read-only
5. **IMPORTANT**: Add admin action audit logging
6. **NICE**: Send approval/rejection emails
7. **NICE**: Add trial expiration UI warnings

