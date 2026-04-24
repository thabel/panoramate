# COMPREHENSIVE ROLE-BASED ACCESS CONTROL (RBAC) ANALYSIS
## Panoramate - Master Branch

**Analysis Date:** 2026-04-20
**Scope:** Complete RBAC system review
**Current Branch:** feat/v1-bativy
**Main Branch:** feat/improve_addhotspot

---

## TABLE OF CONTENTS
1. Role Definitions
2. Role Assignment Mechanisms
3. Permission Matrix
4. Plan Limits & Exemptions
5. Frontend Route Protection
6. API Endpoint Protection
7. Disabled Restrictions
8. Special Cases
9. Critical Findings

---

## 1. ROLE DEFINITIONS

### Database Schema Location
**File:** `/home/ubuntu/own/panoramate/prisma/schema.prisma` (lines 214-219)

```typescript
enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

### Role Descriptions

| Role | Description | Max Per Org | Special Features |
|------|-------------|------------|------------------|
| **OWNER** | Organization founder/creator | 1 | Creates org, full permissions, cannot be removed by ADMIN |
| **ADMIN** | Administrator/operator | Multiple | Can access admin dashboard, approve inscription requests, exempt from plan limits |
| **MEMBER** | Standard team member | Multiple | Can create/manage tours, manage hotspots and images |
| **VIEWER** | Read-only access | Multiple | Can view tours (role defined but not enforced in code) |

---

## 2. ROLE ASSIGNMENT MECHANISMS

### 2.1 Initial Role Assignment (Registration)

**File:** `/home/ubuntu/own/panoramate/src/app/api/auth/register/route.ts` (lines 65-74)

**Default Assignment:**
```typescript
const user = await db.user.create({
  data: {
    // ...
    role: 'OWNER',  // NEW REGISTRANTS ARE ALWAYS OWNER
    organizationId: organization.id,
  },
});
```

**Key Points:**
- All new registrants are automatically assigned **OWNER** role
- Registration is **DISABLED** for public users (redirects to `/request-inscription`)
- See Section 2.3 below for inscription request flow

### 2.2 Invitation-Based Role Assignment

**File:** `/home/ubuntu/own/panoramate/src/app/api/team/route.ts` (lines 62-147)

**Invitation Creation:**
```typescript
const invitation = await db.invitation.create({
  data: {
    email,
    role,  // SPECIFIED BY INVITER
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    organizationId: authPayload.organizationId,
    invitedById: authPayload.userId,
  },
});
```

**Key Points:**
- Inviter specifies desired role for invitee
- Invitation expires in **7 days**
- Role is persisted in `Invitation.role` (default: MEMBER)

**Who Can Invite:**
```typescript
// Line 73-74: ADMIN REJECTION
if (authPayload.role === 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Finding:** ADMINs are **BLOCKED** from inviting members (enforced at API level)

### 2.3 Acceptance of Invitations

**File:** `/home/ubuntu/own/panoramate/src/app/api/team/accept-invite/route.ts` (lines 5-115)

**User Creation on Acceptance:**
```typescript
const user = await db.user.create({
  data: {
    email: invitation.email,
    password: hashedPassword,
    firstName,
    lastName,
    role: invitation.role,  // ROLE FROM INVITATION
    organizationId: invitation.organizationId,
  },
});

await db.invitation.update({
  where: { id: invitation.id },
  data: { acceptedAt: new Date() },
});
```

**Key Points:**
- User created with role from invitation
- Invitation marked as accepted
- User is now active team member

### 2.4 Inscription Request Flow (NEW - Admin Approval)

**Files:**
- Request: `/home/ubuntu/own/panoramate/src/app/api/inscription-request/route.ts` (PUBLIC)
- Admin Dashboard: `/home/ubuntu/own/panoramate/src/app/(dashboard)/admin/inscriptions/page.tsx`
- Approval: `/home/ubuntu/own/panoramate/src/app/api/inscription-request/[id]/approve/route.ts`

**Registration Redirect:**
```typescript
// src/app/(auth)/register/page.tsx
useEffect(() => {
  // Redirect to request-inscription as public registration is disabled
  const timer = setTimeout(() => {
    router.push('/request-inscription');
  }, 0);
}, [router]);
```

**Inscription Request Data:**
```typescript
model InscriptionRequest {
  id: String @id
  type: InscriptionType // FREE or PROFESSIONAL
  firstName: String
  lastName: String
  email: String @unique
  status: InscriptionStatus // PENDING, APPROVED, REJECTED
  approvedAt: DateTime?
  rejectionReason: String?
  // ... other fields
}
```

**Admin Approval Process:**
```typescript
// src/app/api/inscription-request/[id]/approve/route.ts
// Only ADMIN role can approve:
if (!user || user.role !== 'ADMIN') {
  return null;
}

// Update status
await db.inscriptionRequest.update({
  where: { id },
  data: {
    status: 'APPROVED',
    approvedAt: new Date(),
  },
});
```

**Key Points:**
- Public registration disabled
- Users submit inscription requests via `/request-inscription`
- ADMINs review requests in admin dashboard
- ADMIN approves/rejects requests
- **NO AUTOMATIC USER CREATION ON APPROVAL** (current implementation)

---

## 3. PERMISSION MATRIX

### 3.1 Tour Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **Create Tour** | YES | YES* | YES* | NO | Plan limits + isExemptFromLimits() |
| **Read Tours** | ALL* | ALL* | ALL* | VIEW | Disabled: "all authenticated users" |
| **Update Tour** | YES* | YES* | YES* | NO | Disabled: "all authenticated users" |
| **Delete Tour** | YES* | YES* | YES* | NO | Disabled: "all authenticated users" |
| **Tour List** | YES | YES | YES | YES* | Disabled: "all authenticated users" |
| **Publish Tour** | YES* | YES* | YES* | NO | Via PATCH (status field) |
| **Share Tour** | YES* | YES* | YES* | NO | Via share endpoint |

**File:** `/home/ubuntu/own/panoramate/src/app/api/tours/route.ts`
```typescript
// Line 24: RESTRICTION DISABLED
const where: any = {};  // No organization/creator checks

// Line 115: Plan limit check
const canCreate = await canCreateTour(authPayload);
```

**File:** `/home/ubuntu/own/panoramate/src/app/api/tours/[id]/route.ts`
```typescript
// Line 43: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can access all tours

// Line 78: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can access all tours

// Line 138: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can access all tours
```

**CRITICAL FINDING:** All authenticated users can READ, UPDATE, and DELETE any tour in the organization regardless of role or ownership.

### 3.2 Image Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **Upload Images** | YES | YES* | YES* | NO | Plan limits + storage checks |
| **Delete Images** | YES | YES | YES | NO | Disabled |
| **Update Image** | YES | YES | YES | NO | Disabled |
| **List Images** | YES | YES | YES | YES* | Via tour view |

**File:** `/home/ubuntu/own/panoramate/src/app/api/tours/[id]/images/route.ts`

**Upload Restrictions:**
```typescript
// Line 54: Plan limits checked
const canAddImages = await canAddImagesToTour(authPayload, params.id, files.length);

// Line 83: Storage checked
const canAddStorageResult = await canAddStorage(authPayload, ...);
```

**Delete/Update Restrictions:**
```typescript
// Line 177: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can delete images

// Line 241: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can update images
```

**CRITICAL FINDING:** All authenticated users can delete and update any image in any tour regardless of role or ownership.

### 3.3 Hotspot Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **Create Hotspot** | YES | YES | YES | NO | Disabled |
| **Read Hotspots** | YES | YES | YES | YES* | Disabled |
| **Update Hotspot** | YES | YES | YES | NO | Disabled |
| **Delete Hotspot** | YES | YES | YES | NO | Disabled |

**File:** `/home/ubuntu/own/panoramate/src/app/api/tours/[id]/images/[imageId]/hotspots/route.ts`

```typescript
// Line 34: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can view hotspots

// Line 120: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can create hotspots

// Line 243: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can update hotspots

// Line 321: RESTRICTION DISABLED
// RESTRICTION DISABLED: all authenticated users can delete hotspots
```

**CRITICAL FINDING:** All authenticated users can CREATE, READ, UPDATE, and DELETE any hotspot in any tour regardless of role or ownership.

### 3.4 Team Member Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **View Team Members** | YES | YES | YES | YES* | No checks |
| **Send Invitations** | YES | YES | YES | NO | ADMIN BLOCKED |
| **Update Member Role** | YES | NO | NO | NO | Disabled |
| **Remove Member** | YES | NO | NO | NO | Disabled |
| **Accept Invitation** | N/A | N/A | N/A | N/A | Invitation-based |

**File:** `/home/ubuntu/own/panoramate/src/app/api/team/route.ts`

**Invitation Restrictions:**
```typescript
// Line 69: RESTRICTION DISABLED
// RESTRICTION DISABLED: all users can invite members (role checks removed)

// Line 73-74: ADMIN SPECIFIC BLOCK
if (authPayload.role === 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**File:** `/home/ubuntu/own/panoramate/src/app/api/team/[memberId]/route.ts`

**Member Update Restrictions:**
```typescript
// Line 15: RESTRICTION DISABLED
// RESTRICTION DISABLED: all users can manage members (role checks removed)

// Line 27: RESTRICTION DISABLED
// RESTRICTION DISABLED: organization check removed, owner protection removed
```

**Member Delete Restrictions:**
```typescript
// Line 78: RESTRICTION DISABLED
// RESTRICTION DISABLED: all users can remove members (role checks removed)

// Line 90: RESTRICTION DISABLED
// RESTRICTION DISABLED: organization check, owner protection, and self-removal protection all removed
```

**CRITICAL FINDINGS:**
1. ADMINs cannot send invitations (security measure)
2. Anyone with OWNER/MEMBER role can update/remove members
3. No organization checks - can theoretically manage any user
4. No OWNER protection - OWNER can be removed

### 3.5 Admin Dashboard & Inscription Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **View Inscriptions** | NO | YES | NO | NO | Role check in API |
| **Approve Requests** | NO | YES | NO | NO | Role check in API |
| **Reject Requests** | NO | YES | NO | NO | Role check in API |
| **Access Admin Panel** | NO | YES | NO | NO | Frontend + API |

**Frontend Protection:**
**File:** `/home/ubuntu/own/panoramate/src/app/(dashboard)/layout.tsx` (lines 86-93)
```typescript
...(isAdmin
  ? [
      {
        label: 'Admin',
        href: '/admin/inscriptions',
        icon: Shield,
      },
    ]
  : []),
```

**File:** `/home/ubuntu/own/panoramate/src/app/(dashboard)/admin/inscriptions/page.tsx` (lines 48-53)
```typescript
// Check if user is admin
useEffect(() => {
  if (!authLoading && user && user.role !== 'ADMIN') {
    router.push('/dashboard');
    toast.error('Admin access required');
  }
}, [authLoading, user, router]);
```

**API Protection:**
**File:** `/home/ubuntu/own/panoramate/src/app/api/admin/inscriptions/route.ts` (lines 6-39)
```typescript
async function verifyAdminAuth(request: NextRequest) {
  // ...
  if (!user || user.role !== 'ADMIN') {
    return null;
  }
  return user;
}
```

**Approval Process:**
**File:** `/home/ubuntu/own/panoramate/src/app/api/inscription-request/[id]/approve/route.ts` (lines 19-33)
```typescript
async function verifyAdminAuth(request: NextRequest) {
  // Get user and check if admin
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}
```

**KEY FINDING:** Admin operations are properly protected on both frontend and API levels.

### 3.6 Billing & Subscription Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **View Plans** | YES | YES | YES | YES | No auth required |
| **Subscribe** | YES | YES | YES | YES | No auth required |
| **View Invoices** | Limited | Limited | Limited | Limited | Organization-based |
| **Access Portal** | YES | YES | YES | YES | No auth required |

**File:** `/home/ubuntu/own/panoramate/src/app/api/billing/plans/route.ts`
```typescript
export async function GET(request: NextRequest) {
  // No authentication required - returns hardcoded plans
  const plans = await db.plan.findMany({
    where: { isActive: true },
  });
}
```

**KEY FINDING:** Billing views are organization-scoped but no role checks applied.

### 3.7 Settings & Profile Management

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **View Own Profile** | YES | YES | YES | YES | Auth required |
| **Update Profile** | Assumed | Assumed | Assumed | Assumed | Not explicitly enforced |
| **View Organization Settings** | YES | YES | YES | Assumed | Not explicitly enforced |

**File:** `/home/ubuntu/own/panoramate/src/app/api/auth/me/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const authPayload = await getAuthUser(request);
  if (!authPayload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: authPayload.userId },
    include: { organization: true },
  });
}
```

**KEY FINDING:** Settings endpoints only check authentication, not role-based permissions.

### 3.8 Comparisons (New Feature)

| Feature | OWNER | ADMIN | MEMBER | VIEWER | Protection |
|---------|-------|-------|--------|--------|-----------|
| **Create Comparison** | YES | YES | YES | NO | Organization-scoped |
| **List Comparisons** | YES | YES | YES | NO | Organization-scoped |
| **Delete Comparison** | YES | YES | YES | NO | Assumed disabled |

**File:** `/home/ubuntu/own/panoramate/src/app/api/comparisons/route.ts`
```typescript
const comparison = await db.comparison.create({
  data: {
    title: title || 'Comparison ' + new Date().toLocaleDateString(),
    organizationId: authPayload.organizationId,  // Organization-scoped
    createdById: authPayload.userId,
  },
});
```

**KEY FINDING:** Comparisons are organization-scoped but no role-based permission checks.

---

## 4. PLAN LIMITS & EXEMPTIONS

### 4.1 Plan Limits Definition

**File:** `/home/ubuntu/own/panoramate/src/lib/stripe.ts` (lines 11-40)

```typescript
export const PLAN_LIMITS = {
  FREE_TRIAL: {
    maxTours: 1,
    maxImages: 10,
    storageMb: 500,
    priceMonthly: 0,
    priceYearly: 0,
  },
  STARTER: {
    maxTours: 5,
    maxImages: 50,
    storageMb: 2048,
    priceMonthly: 2900,  // $29.00
    priceYearly: 29000,
  },
  PROFESSIONAL: {
    maxTours: 20,
    maxImages: 200,
    storageMb: 10240,
    priceMonthly: 7900,  // $79.00
    priceYearly: 79000,
  },
  ENTERPRISE: {
    maxTours: -1,          // Unlimited
    maxImages: -1,         // Unlimited
    storageMb: 102400,     // 100GB
    priceMonthly: 19900,   // $199.00
    priceYearly: 199000,
  },
};
```

**Limit Types:**
- **maxTours:** Number of virtual tours allowed
- **maxImages:** Number of scenes per tour
- **storageMb:** Total storage in megabytes (-1 = unlimited)

### 4.2 ADMIN Exemption from Plan Limits

**File:** `/home/ubuntu/own/panoramate/src/lib/plan-limits.ts` (lines 14-16)

```typescript
export function isExemptFromLimits(authPayload: AuthPayload): boolean {
  return authPayload.role === 'ADMIN';
}
```

**Usage Locations:**

1. **Tour Creation Exemption** (lines 32-34):
```typescript
export async function canCreateTour(authPayload: AuthPayload): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }
  // ... plan limit checks
}
```

2. **Image Upload Exemption** (lines 93-94):
```typescript
export async function canAddImagesToTour(
  authPayload: AuthPayload,
  tourId: string,
  imageCountToAdd: number = 1
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }
  // ... plan limit checks
}
```

3. **Storage Exemption** (lines 155-156):
```typescript
export async function canAddStorage(
  authPayload: AuthPayload,
  additionalMb: number
): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  if (isExemptFromLimits(authPayload)) {
    return { allowed: true };
  }
  // ... storage limit checks
}
```

### 4.3 Trial Expiration Check

**File:** `/home/ubuntu/own/panoramate/src/lib/plan-limits.ts` (lines 21-23)

```typescript
export function isTrialExpired(trialEndsAt: Date): boolean {
  return new Date() > trialEndsAt;
}
```

**Applied in Plan Checks:**
```typescript
// Check if trial has expired for FREE_TRIAL plan
if (org.plan === 'FREE_TRIAL' && isTrialExpired(org.trialEndsAt)) {
  return {
    allowed: false,
    reason: 'Your free trial has expired. Please upgrade your plan.',
  };
}
```

### 4.4 Free Trial Plan

**File:** `/home/ubuntu/own/panoramate/src/app/api/auth/register/route.ts` (lines 51-62)

```typescript
const organization = await db.organization.create({
  data: {
    name: organizationName,
    slug,
    plan: 'FREE_TRIAL',
    subscriptionStatus: 'TRIALING',
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),  // 14 days
    maxTours: 1,
    maxImagesPerTour: 10,
    totalStorageMb: 200,  // Different from PLAN_LIMITS
  },
});
```

**DISCREPANCY FOUND:** 
- PLAN_LIMITS.FREE_TRIAL.storageMb = 500 MB
- But registration sets totalStorageMb = 200 MB

### 4.5 Exemption Summary

| Operation | FREE_TRIAL | STARTER | PROFESSIONAL | ENTERPRISE | ADMIN |
|-----------|-----------|---------|--------------|------------|-------|
| Create Tour | 1 | 5 | 20 | Unlimited | Unlimited |
| Add Images | 10 | 50 | 200 | Unlimited | Unlimited |
| Storage | 500 MB | 2 GB | 10 GB | 100 GB | Unlimited |
| **EXEMPT** | No | No | No | No | **YES** |

---

## 5. MIDDLEWARE PROTECTION

### 5.1 Middleware Configuration

**File:** `/home/ubuntu/own/panoramate/src/middleware.ts`

**Public Routes (No Auth Required):**
```typescript
const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/billing/webhook',
  '/api/tours-public',
  '/api/inscription-request',  // NEW
  '/tour/',                      // Public tour viewer
  '/login',
  '/register',
  '/request-inscription',        // NEW
];
```

**Protected Routes (Auth Required):**
```typescript
export const config = {
  matcher: [
    '/api/:path*',             // All API routes
    '/dashboard/:path*',       // Dashboard pages
    '/admin/:path*',           // Admin pages
    '/tours/:path*',           // Tours pages
    // ... rest of app
  ],
};
```

**Auth Validation:**
```typescript
const token = request.cookies.get('token')?.value;
const authHeader = request.headers.get('authorization');

let tokenToVerify = token;
if (authHeader?.startsWith('Bearer ')) {
  tokenToVerify = authHeader.slice(7);
}

if (!tokenToVerify) {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

const payload = await verifyJWT(tokenToVerify);
if (!payload) {
  // ... redirect/return error
}
```

**KEY FINDING:** Middleware only validates JWT existence, NOT role or permissions.

---

## 6. FRONTEND ROUTE PROTECTION

### 6.1 Dashboard Layout Protection

**File:** `/home/ubuntu/own/panoramate/src/app/(dashboard)/layout.tsx`

**Authentication Check:**
```typescript
useEffect(() => {
  if (!isLoading && !user) {
    router.push('/login');
  }
}, [isLoading, user, router]);
```

**Admin Panel Conditional Rendering:**
```typescript
const isAdmin = user.role === 'ADMIN';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Tours', href: '/tours', icon: FileStack },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
  ...(isAdmin
    ? [
        {
          label: 'Admin',
          href: '/admin/inscriptions',
          icon: Shield,
        },
      ]
    : []),
];
```

**KEY FINDING:** Admin link conditionally rendered (security through obscurity, not real protection).

### 6.2 Admin Inscriptions Page Protection

**File:** `/home/ubuntu/own/panoramate/src/app/(dashboard)/admin/inscriptions/page.tsx`

**Dual Protection:**

1. **Frontend Check:**
```typescript
useEffect(() => {
  if (!authLoading && user && user.role !== 'ADMIN') {
    router.push('/dashboard');
    toast.error('Admin access required');
  }
}, [authLoading, user, router]);
```

2. **API Calls Protected:**
```typescript
const response = await fetch('/api/admin/inscriptions?status=PENDING&limit=100');
if (!response.ok) {
  throw new Error('Failed to fetch requests');
}
```

**KEY FINDING:** Frontend provides user experience, but API is the true protection layer.

---

## 7. DISABLED RESTRICTIONS (CRITICAL FINDINGS)

### 7.1 List of Disabled Checks

| Restriction | Location | Impact | Notes |
|-------------|----------|--------|-------|
| **Tour Ownership Check** | `/api/tours/[id]/route.ts` (lines 43, 78, 138) | All users can READ/UPDATE/DELETE any tour | Comments: "RESTRICTION DISABLED: all authenticated users can access all tours" |
| **Image Ownership Check** | `/api/tours/[id]/images/route.ts` (lines 177, 241) | All users can DELETE/UPDATE any image | Comments: "RESTRICTION DISABLED: all authenticated users can..." |
| **Hotspot Ownership Check** | `/api/tours/[id]/images/[imageId]/hotspots/route.ts` (lines 34, 120, 243, 321) | All users can VIEW/CREATE/UPDATE/DELETE any hotspot | Comments: "RESTRICTION DISABLED: all authenticated users..." |
| **Member Update Role Check** | `/api/team/[memberId]/route.ts` (lines 15, 27) | All authenticated users can change member roles | Comments: "RESTRICTION DISABLED: all users can manage members" |
| **Member Delete Protection** | `/api/team/[memberId]/route.ts` (lines 78, 90) | All authenticated users can remove any member | Comments: "RESTRICTION DISABLED: organization check, owner protection, and self-removal protection all removed" |
| **Invitation Permission Check** | `/api/team/route.ts` (line 69) | Non-ADMIN users can invite (ADMIN blocked instead) | Comment: "RESTRICTION DISABLED: all users can invite members" |

### 7.2 Organization Isolation Status

**STATUS:** DISABLED

**Evidence:**
- `/api/tours/route.ts` line 24: `const where: any = {}` - No organizationId filter
- `/api/tours/[id]/route.ts` line 43: No organization ownership check
- `/api/team/[memberId]/route.ts` line 27: No organization check mentioned

**CRITICAL VULNERABILITY:** A user can potentially:
1. View all tours across organization
2. Modify tours created by other members
3. Delete images from other members' tours
4. Manage team members without restriction
5. Add/remove any member from the organization

---

## 8. SPECIAL CASES & EDGE CASES

### 8.1 ADMIN Cannot Invite Members

**Finding:** ADMINs are specifically blocked from inviting members

**File:** `/home/ubuntu/own/panoramate/src/app/api/team/route.ts` (lines 73-74)
```typescript
if (authPayload.role === 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Implication:** ADMINs can manage but not recruit team members

### 8.2 Public Registration Disabled

**Finding:** Direct registration at `/register` is disabled

**File:** `/home/ubuntu/own/panoramate/src/app/(auth)/register/page.tsx` (lines 9-16)
```typescript
useEffect(() => {
  // Redirect to request-inscription as public registration is disabled
  const timer = setTimeout(() => {
    router.push('/request-inscription');
  }, 0);
  return () => clearTimeout(timer);
}, [router]);
```

**Reason:** Users must go through inscription request flow → admin approval

### 8.3 Inscription Request Approval

**Current Status:** Manual approval by ADMIN

**Missing:** Automatic user creation on approval

**Process:**
1. User submits inscription request
2. Request stored in `InscriptionRequest` table with PENDING status
3. Admin views in admin dashboard
4. Admin clicks "Approve"
5. Status changed to APPROVED
6. **NO AUTOMATIC:** User creation NOT implemented
7. **MISSING:** Email notification about approval

### 8.4 JWT Token Payload Structure

**File:** `/home/ubuntu/own/panoramate/src/lib/auth.ts` (lines 77-85)

```typescript
const token = await signJWT(
  {
    userId: user.id,
    email: user.email,
    organizationId: organization.id,
    role: user.role,
  },
  '7d'
);
```

**Token Includes:**
- userId
- email
- organizationId
- role (used for exemptions)

**Token Expiration:** 7 days

---

## 9. AUTHENTICATION & SESSION MANAGEMENT

### 9.1 Session Storage

**Model:** `/home/ubuntu/own/panoramate/prisma/schema.prisma` (lines 65-77)

```typescript
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique @db.VarChar(512)
  expiresAt DateTime
  ipAddress String?
  userAgent String?  @db.Text
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**STATUS:** Defined but NOT actively used in authentication flow

### 9.2 Login Flow

**File:** `/home/ubuntu/own/panoramate/src/app/api/auth/login/route.ts`

**Process:**
1. Verify credentials
2. Generate JWT token
3. Set httpOnly cookie
4. Return token in response (also in localStorage by frontend)

**Cookie Settings:**
```typescript
response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
});
```

### 9.3 Token Verification

**File:** `/home/ubuntu/own/panoramate/src/lib/auth.ts` (lines 28-44)

```typescript
export async function getAuthUser(request: Request): Promise<any> {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token);
    if (payload) return payload;
  }

  // Try cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload) return payload;
  }

  return null;
}
```

**Supports:**
- Authorization header: `Bearer <token>`
- Cookie: `token=<value>`

---

## 10. COMPREHENSIVE PERMISSION MATRIX

| Permission | OWNER | ADMIN | MEMBER | VIEWER | Enforced |
|-----------|-------|-------|--------|--------|----------|
| **TOUR OPERATIONS** |
| Create Tour (respects plan limits) | YES | YES* | YES* | NO | Partial |
| List Tours | YES* | YES* | YES* | YES* | NO |
| View Tour Details | YES* | YES* | YES* | YES* | NO |
| Update Tour | YES* | YES* | YES* | NO | NO |
| Delete Tour | YES* | YES* | YES* | NO | NO |
| Publish Tour | YES* | YES* | YES* | NO | NO |
| **IMAGE OPERATIONS** |
| Upload Images (respects plan limits) | YES | YES* | YES* | NO | Partial |
| View Images | YES* | YES* | YES* | YES* | NO |
| Delete Images | YES* | YES* | YES* | NO | NO |
| Update Image Metadata | YES* | YES* | YES* | NO | NO |
| **HOTSPOT OPERATIONS** |
| Create Hotspots | YES* | YES* | YES* | NO | NO |
| View Hotspots | YES* | YES* | YES* | YES* | NO |
| Update Hotspots | YES* | YES* | YES* | NO | NO |
| Delete Hotspots | YES* | YES* | YES* | NO | NO |
| **TEAM OPERATIONS** |
| View Team Members | YES | YES | YES | YES* | NO |
| Invite Members | YES | NO | YES | NO | Partial |
| Update Member Role | YES | NO | NO | NO | NO |
| Remove Member | YES | NO | NO | NO | NO |
| Accept Invitation | Invite Only | Invite Only | Invite Only | Invite Only | YES |
| **ADMIN OPERATIONS** |
| Access Admin Dashboard | NO | YES | NO | NO | YES |
| View Inscription Requests | NO | YES | NO | NO | YES |
| Approve Requests | NO | YES | NO | NO | YES |
| Reject Requests | NO | YES | NO | NO | YES |
| **BILLING OPERATIONS** |
| View Plans | YES | YES | YES | YES | NO |
| Subscribe | YES | YES | YES | YES | NO |
| View Invoices | YES* | YES* | YES* | Limited | NO |
| Access Billing Portal | YES | YES | YES | YES | NO |
| **SETTINGS** |
| View Profile | YES | YES | YES | YES | Auth Only |
| Update Profile | YES | YES | YES | Assumed | NO |

**Legend:**
- YES = Allowed
- YES* = Allowed but not properly enforced
- NO = Blocked
- Partial = Some enforcement
- Auth Only = Only authentication required, no role check

---

## 11. CRITICAL SECURITY FINDINGS

### Finding 1: Organization Data Isolation Disabled
**Severity:** CRITICAL
**Files:** Multiple API endpoints
**Issue:** No checks to verify user's organization owns the resource
**Impact:** Users can potentially access/modify data from other organizations
**Status:** Disabled intentionally (comments say "RESTRICTION DISABLED")

### Finding 2: Role-Based Permissions Largely Unenforced
**Severity:** HIGH
**Files:** `/api/tours/*`, `/api/hotspots/*`, `/api/images/*`
**Issue:** Most operations don't verify user role
**Impact:** VIEWER, MEMBER, OWNER can all perform same operations
**Status:** Intentionally disabled (explicit comments)

### Finding 3: ADMIN Exemption Requires Vigilant Audit
**Severity:** MEDIUM
**Files:** `/lib/plan-limits.ts`
**Issue:** ADMIN bypass all storage and tour limits
**Impact:** Unlimited resource consumption
**Mitigation:** Only assign ADMIN role to trusted operators

### Finding 4: ADMINs Cannot Invite Members
**Severity:** LOW
**Files:** `/api/team/route.ts`
**Issue:** ADMINs blocked from inviting (opposite of expected)
**Impact:** ADMINs can only manage existing members
**Status:** Likely intentional security measure

### Finding 5: Inscription Request Auto-Creation Missing
**Severity:** MEDIUM
**Files:** Approval endpoints
**Issue:** Approving request doesn't create user account
**Impact:** Manual setup required; UX friction
**Status:** Not implemented

### Finding 6: Storage Limit Discrepancy
**Severity:** LOW
**Files:** `/api/auth/register/route.ts` vs `/lib/stripe.ts`
**Issue:** Registration creates 200MB quota, PLAN_LIMITS defines 500MB for FREE_TRIAL
**Impact:** Inconsistent storage allocation
**Status:** Potential bug

### Finding 7: Trial Expiration Not Enforced in UI
**Severity:** MEDIUM
**Files:** Frontend pages
**Issue:** Trial expiration checked only on tour creation, not UI warnings
**Impact:** Users may not know trial expired until trying to create tour
**Status:** No deprecation warnings shown

---

## 12. MATRIX SUMMARY TABLE

```
Role: OWNER
├─ Invitations: Can invite MEMBER, VIEWER
├─ Can Manage: Team members (update, remove)
├─ Plan Limits: Respects organization limits
├─ Tours: Create, Read, Update, Delete (all)
├─ Images: Upload, Delete, Update
├─ Hotspots: Create, Read, Update, Delete
├─ Admin Access: NO
└─ Limit Exemption: NO

Role: ADMIN
├─ Invitations: BLOCKED (cannot invite)
├─ Can Manage: Team members (update, remove)
├─ Plan Limits: EXEMPT - Unlimited tours, images, storage
├─ Tours: Create, Read, Update, Delete (all)
├─ Images: Upload, Delete, Update
├─ Hotspots: Create, Read, Update, Delete
├─ Admin Access: YES
├─ Dashboard: Yes (inscription requests)
├─ Approval Rights: YES
└─ Limit Exemption: YES

Role: MEMBER
├─ Invitations: Can invite (if not ADMIN?)
├─ Can Manage: Cannot manage team members
├─ Plan Limits: Respects organization limits
├─ Tours: Create, Read, Update, Delete (all)
├─ Images: Upload, Delete, Update
├─ Hotspots: Create, Read, Update, Delete
├─ Admin Access: NO
└─ Limit Exemption: NO

Role: VIEWER
├─ Invitations: NO
├─ Can Manage: NO
├─ Plan Limits: N/A
├─ Tours: Read (limited)
├─ Images: Read
├─ Hotspots: Read
├─ Admin Access: NO
└─ Enforcement: Role defined but NOT enforced in code
```

---

## 13. ROLE ASSIGNMENT WORKFLOW DIAGRAM

```
VISITOR
├─ Visits /register
├─ Redirected to /request-inscription
├─ Submits inscription request
│  └─ Type: FREE or PROFESSIONAL
│  └─ Status: PENDING
│  └─ Stored in InscriptionRequest table
│
ADMIN
├─ Views /admin/inscriptions
├─ Reviews pending requests
├─ Clicks "Approve"
│  └─ API: POST /api/inscription-request/{id}/approve
│  └─ Status: APPROVED
│  └─ approvedAt: Set to now()
│
MANUALLY (Missing automation)
├─ Admin creates user account
│  OR
├─ System sends email (not implemented)
│
REGISTERED USER
├─ Creates account at /register (actually /request-inscription)
├─ Assigned role: OWNER
├─ Organization created with FREE_TRIAL plan
│
OWNER
├─ Can invite users
├─ Invited users get role: MEMBER (default)
├─ Users accept invite
│  └─ API: POST /api/team/accept-invite
│  └─ User created with invitation.role
│
NEW TEAM MEMBER (MEMBER role)
├─ Can create/manage tours
├─ Can invite other members (MEMBER can invite)
├─ Plan limits apply
└─ Cannot access admin panel

ADMIN USER (Assigned by OWNER)
├─ Cannot invite members (blocked)
├─ Can manage team members (update/remove)
├─ Plan limits EXEMPT
├─ Can create unlimited tours
├─ Can approve inscription requests
├─ Can access admin dashboard
└─ Full system access except invitations
```

---

## 14. ENDPOINT PROTECTION SUMMARY

### Fully Protected (Role + Auth)
- `POST /api/admin/inscriptions` (ADMIN only)
- `POST /api/inscription-request/[id]/approve` (ADMIN only)
- `GET /api/(dashboard)/admin/inscriptions` (Frontend: ADMIN only)

### Partially Protected (Auth Only)
- `GET /api/tours` (Checks auth, not role)
- `POST /api/tours` (Checks auth + plan limits, not role)
- `PATCH /api/tours/[id]` (Checks auth, not role)
- `DELETE /api/tours/[id]` (Checks auth, not role)
- All hotspot endpoints (Auth only)
- All image endpoints (Auth only, except storage limit check)

### Unprotected (Public)
- `POST /api/inscription-request` (Public submission)
- `POST /api/auth/register` (Public - but redirects)
- `POST /api/auth/login` (Public)
- `GET /api/billing/plans` (Public)

---

## 15. RECOMMENDATIONS

1. **Enable Organization Scoping** - Add organizationId checks to all API endpoints
2. **Implement Role Checks** - Enforce VIEWER as read-only role
3. **Separate ADMIN Invitations** - Reconsider why ADMINs can't invite
4. **Complete Inscription Workflow** - Auto-create users on approval
5. **Add Trial Warnings** - Show UI warnings before trial expires
6. **Fix Storage Discrepancy** - Align registration with PLAN_LIMITS
7. **Implement Audit Logging** - Log all permission checks
8. **Add Rate Limiting** - Prevent abuse of plan-exempt ADMINs
9. **Enforce VIEWER Role** - Currently defined but not used
10. **Document Intentional Disabling** - Add rationale for disabled checks

---

## CONCLUSION

The Panoramate application has a foundational RBAC system with 4 roles (OWNER, ADMIN, MEMBER, VIEWER) and a plan-based limit system. However, most resource ownership and role-based permission checks are intentionally disabled, resulting in a flat permission model where all authenticated users can perform the same operations. The primary enforcement is through:

1. **JWT Token Validation** - Authentication layer
2. **Plan Limits** - With ADMIN exemption
3. **Admin Exclusive Features** - Inscription request management
4. **Invitation-based Onboarding** - Role assignment via invitations

The disabled restrictions appear intentional based on explicit comments in the code, suggesting this is a current development state rather than accidental oversight.
