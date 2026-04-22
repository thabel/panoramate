# Role-Based Access Control (RBAC) Documentation Index

## Overview

This documentation provides a comprehensive analysis of the Panoramate application's Role-Based Access Control (RBAC) system, including role definitions, permission matrices, authentication flow, and security findings.

**Analysis Date:** April 20, 2026
**Branch:** feat/v1-bativy
**Main Branch:** feat/improve_addhotspot

---

## Documentation Files

### 1. RBAC_QUICK_REFERENCE.md (8 KB)
**For:** Quick lookup and testing
**Contains:**
- Role hierarchy visualization
- Permission matrix at a glance
- File location index
- Key findings summary
- Invitation and inscription flows
- Code snippets for critical functions
- Testing instructions
- Environment variables

**Start here if you need:** A quick overview or need to test a specific role

---

### 2. RBAC_SUMMARY.txt (12 KB)
**For:** Executive overview and risk assessment
**Contains:**
- Role definitions and assignment flow
- Permission enforcement status (by feature)
- Plan limits and exemptions
- Critical security findings (5 findings)
- Disabled restrictions list
- Special role behaviors
- Middleware and auth flow
- Risk assessment (Critical/High/Medium/Low)
- Recommendations by priority

**Start here if you need:** A structured overview of the entire system

---

### 3. RBAC_ANALYSIS.md (36 KB) - COMPREHENSIVE
**For:** In-depth technical analysis with code references
**Contains:**
- All role definitions with descriptions
- Detailed role assignment mechanisms (4 sections)
- Complete permission matrix (8 subsections)
  - Tour management (with file references)
  - Image management (with file references)
  - Hotspot management (with file references)
  - Team member management (with file references)
  - Admin dashboard & inscription (with file references)
  - Billing & subscription (with file references)
  - Settings & profile (with file references)
  - Comparisons feature (with file references)
- Plan limits definition (5 subsections)
  - Plan limits (4 tiers)
  - ADMIN exemption (3 locations)
  - Trial expiration check
  - Free trial plan
  - Exemption summary
- Middleware protection (2 subsections)
- Frontend route protection (2 subsections)
- Disabled restrictions (2 subsections with evidence)
- Special cases & edge cases (4 subsections)
- Authentication & session management (3 subsections)
- Comprehensive permission matrix (full scope)
- Critical security findings (7 findings with severity)
- Endpoint protection summary
- Full recommendations

**Start here if you need:** Complete technical documentation with exact file references and code snippets

---

## Quick Navigation

### By Use Case

**I need to...**

| Task | Best File | Section |
|------|-----------|---------|
| Understand roles quickly | QUICK_REFERENCE | Role Hierarchy |
| Check what a role can do | QUICK_REFERENCE | Permission Matrix |
| Find API endpoint files | QUICK_REFERENCE | File Locations |
| Present to stakeholders | SUMMARY | Entire document |
| Write code to fix issues | ANALYSIS | Specific feature section |
| Audit permissions | ANALYSIS | Permission Matrix (section 3) |
| Test a feature | QUICK_REFERENCE | Testing the System |
| Find security issues | SUMMARY | Critical Security Findings |
| Check admin functionality | QUICK_REFERENCE | File Locations: Admin |
| Understand plan limits | QUICK_REFERENCE | Plan Limits table |

### By Role

**Understanding [Role Name]**

| Role | Best File | Section |
|------|-----------|---------|
| OWNER | QUICK_REFERENCE | Role Hierarchy |
| ADMIN | QUICK_REFERENCE | Role Hierarchy + Special behaviors |
| MEMBER | QUICK_REFERENCE | Role Hierarchy |
| VIEWER | ANALYSIS | Section 3.3 (Hotspot) or 3.1 (Tour) |

### By Feature

**Understanding [Feature]**

| Feature | Best File | Section |
|---------|-----------|---------|
| Authentication | ANALYSIS | Section 9 |
| Tour Management | ANALYSIS | Section 3.1 |
| Image Management | ANALYSIS | Section 3.2 |
| Hotspot Management | ANALYSIS | Section 3.3 |
| Team Management | ANALYSIS | Section 3.4 |
| Admin Dashboard | ANALYSIS | Section 3.5 |
| Plan Limits | ANALYSIS | Section 4 |
| Inscription Requests | QUICK_REFERENCE | Inscription Request Flow |
| Plan Exemptions | QUICK_REFERENCE | Plan Limits |

---

## Key Files Reviewed

### Schema Definition
- `prisma/schema.prisma` - Role enum definition, database models

### Authentication & Middleware
- `src/lib/auth.ts` - JWT creation, verification, password hashing
- `src/middleware.ts` - Route protection, token validation

### Authorization & Plan Limits
- `src/lib/plan-limits.ts` - ADMIN exemption logic
- `src/lib/stripe.ts` - Plan definitions, pricing

### API Routes - Core
- `src/app/api/auth/register/route.ts` - Registration (disabled)
- `src/app/api/auth/login/route.ts` - Login
- `src/app/api/auth/me/route.ts` - Current user info

### API Routes - Tours
- `src/app/api/tours/route.ts` - List/create tours
- `src/app/api/tours/[id]/route.ts` - Read/update/delete tour
- `src/app/api/tours/[id]/images/route.ts` - Image upload/delete
- `src/app/api/tours/[id]/images/[imageId]/hotspots/route.ts` - Hotspot CRUD

### API Routes - Team & Admin
- `src/app/api/team/route.ts` - List members, invite users
- `src/app/api/team/[memberId]/route.ts` - Update/remove members
- `src/app/api/team/accept-invite/route.ts` - Accept invitation
- `src/app/api/admin/inscriptions/route.ts` - List inscription requests
- `src/app/api/inscription-request/[id]/approve/route.ts` - Approve request

### Frontend Pages
- `src/app/(dashboard)/layout.tsx` - Dashboard navigation (role-based)
- `src/app/(dashboard)/admin/inscriptions/page.tsx` - Admin panel
- `src/app/(auth)/register/page.tsx` - Registration redirect
- `src/app/(request-inscription)/request-inscription/page.tsx` - Inscription form

---

## Executive Summary

### What Works
- JWT authentication with 7-day tokens
- Admin dashboard access control
- Plan limit enforcement
- ADMIN exemption system
- Invitation-based onboarding
- Trial expiration checks

### What's Not Enforced (Intentionally Disabled)
- Tour/image/hotspot ownership checks
- Organization data isolation
- VIEWER role enforcement
- Member role update restrictions
- Member deletion protections

### Critical Issues
1. All authenticated users can modify any tour/image/hotspot
2. Organization data not properly isolated
3. Inscription auto-creation not implemented
4. ADMIN users cannot invite members (blocked)

### Plan Limits
| Plan | Tours | Images | Storage |
|------|-------|--------|---------|
| FREE_TRIAL | 1 | 10 | 500 MB |
| STARTER | 5 | 50 | 2 GB |
| PROFESSIONAL | 20 | 200 | 10 GB |
| ENTERPRISE | Unlimited | Unlimited | 100 GB |

ADMIN role is exempt from all limits.

---

## Common Questions

### Q: Can a MEMBER delete another MEMBER's tour?
**A:** Yes. Ownership checks are disabled. Any authenticated user can delete any tour.

*Reference: ANALYSIS.md Section 3.1, QUICK_REFERENCE.md "What's Broken/Disabled"*

### Q: Can an ADMIN user invite new team members?
**A:** No. ADMINs are specifically blocked from inviting users via explicit API check.

*Reference: QUICK_REFERENCE.md Role Hierarchy, ANALYSIS.md Section 3.4*

### Q: How does the ADMIN exemption work?
**A:** The `isExemptFromLimits()` function in `src/lib/plan-limits.ts` checks if `authPayload.role === 'ADMIN'` and returns true, bypassing all limit checks.

*Reference: QUICK_REFERENCE.md "Critical Code Sections", ANALYSIS.md Section 4.2*

### Q: What happens when someone clicks "Approve" on an inscription request?
**A:** The request status changes to APPROVED and approvedAt is set. User creation is NOT implemented.

*Reference: QUICK_REFERENCE.md "Inscription Request Flow", ANALYSIS.md Section 2.4*

### Q: Which routes require authentication?
**A:** All routes except those explicitly listed in `src/middleware.ts` public routes array.

*Reference: QUICK_REFERENCE.md "Public Routes" & "Protected Routes", ANALYSIS.md Section 5.1*

### Q: How are roles assigned when a user accepts an invitation?
**A:** User is created with the role specified in the Invitation record, which was set by the inviter.

*Reference: QUICK_REFERENCE.md "Invitation Flow", ANALYSIS.md Section 2.2*

### Q: Can the VIEWER role view all tours?
**A:** The VIEWER role is defined in the schema but permission checks are not implemented. In practice, VIEWER can do the same as MEMBER.

*Reference: ANALYSIS.md Section 3.1 (tours) shows no VIEWER restrictions, Section 3.3 (hotspots)*

---

## For Development

### If you're implementing role-based restrictions:

1. **Start with:** QUICK_REFERENCE.md Section "File Locations"
2. **Study:** ANALYSIS.md Section 7 "Disabled Restrictions"
3. **Reference:** Specific endpoint code from key files
4. **Check:** SUMMARY.txt "Critical Security Findings"

### If you're fixing the inscription flow:

1. **Read:** ANALYSIS.md Section 2.4 "Inscription Request Flow"
2. **Check:** QUICK_REFERENCE.md "Inscription Request Flow"
3. **Review:** File locations for inscription endpoints
4. **Plan:** Auto-creation and email notification logic

### If you're auditing security:

1. **Read:** SUMMARY.txt "Critical Security Findings"
2. **Review:** ANALYSIS.md Section 7 "Disabled Restrictions"
3. **Check:** ANALYSIS.md Section 11 "Critical Security Findings"
4. **Reference:** ANALYSIS.md Section 14 "Recommendations"

---

## Testing the System

### Test Credentials
- Email: `demo@panoramate.com`
- Password: `Demo1234!`
- Role: OWNER

### Create Test User
```bash
npm run db:create-test-user
```

### Test Scenarios
See QUICK_REFERENCE.md Section "Testing the System"

---

## Document Versions

| File | Type | Size | Last Updated |
|------|------|------|--------------|
| RBAC_QUICK_REFERENCE.md | Quick Ref | 8 KB | 2026-04-20 |
| RBAC_SUMMARY.txt | Executive | 12 KB | 2026-04-20 |
| RBAC_ANALYSIS.md | Technical | 36 KB | 2026-04-20 |
| RBAC_INDEX.md | Navigation | This file | 2026-04-20 |

---

## How to Use This Documentation

### First Time?
1. Start with QUICK_REFERENCE.md
2. Review the role hierarchy and permission matrix
3. Skim the key findings

### Deep Dive?
1. Read SUMMARY.txt for overview
2. Review critical findings
3. Dive into ANALYSIS.md for specific sections
4. Cross-reference code files

### Looking for Something Specific?
1. Use the navigation tables above
2. Check "By Use Case" or "By Feature"
3. Jump directly to the right document and section

### Presenting to Stakeholders?
1. Use SUMMARY.txt as your main document
2. Highlight "Risk Assessment" section
3. Reference QUICK_REFERENCE.md for diagrams

---

## Contributing Updates

When you discover new information about the RBAC system:

1. Update the appropriate file (QUICK_REFERENCE for quick items, ANALYSIS for detailed)
2. Update this INDEX if adding new sections
3. Keep file sizes reasonable:
   - QUICK_REFERENCE: Under 10 KB
   - SUMMARY: Under 15 KB
   - ANALYSIS: Can be 40+ KB

---

## Related Documentation

- Project Instructions: `CLAUDE.md`
- Architecture Overview: `CLAUDE.md` Section "Architecture Overview"
- Database Schema: `prisma/schema.prisma`
- Environment Setup: `CLAUDE.md` Section "Environment Configuration"

