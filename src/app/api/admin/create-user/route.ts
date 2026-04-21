import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getAuthUser, generateSlug } from '@/lib/auth';

/**
 * Admin endpoint to create users via API
 * POST /api/admin/create-user
 * Body: { email, firstName, lastName, password, role, organizationName?, organizationSlug? }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password, role, organizationName, organizationSlug } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName, password, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `User with email ${email} already exists` },
        { status: 409 }
      );
    }

    // Create or get organization
    let organization;

    if (organizationName && organizationSlug) {
      // Check if org already exists
      const existingOrg = await db.organization.findUnique({
        where: { slug: organizationSlug },
      });

      if (existingOrg) {
        organization = existingOrg;
      } else {
        // Create new organization
        organization = await db.organization.create({
          data: {
            name: organizationName,
            slug: organizationSlug,
            plan: 'FREE_TRIAL',
            subscriptionStatus: 'TRIALING',
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        });
      }
    } else {
      // Use or create default test organization
      organization = await db.organization.upsert({
        where: { slug: 'test-org' },
        update: {},
        create: {
          name: 'Test Organization',
          slug: 'test-org',
          plan: 'FREE_TRIAL',
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isVerified: true,
        organizationId: organization.id,
      },
      include: {
        organization: true,
      },
    });

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user. Check server logs for details.' },
      { status: 500 }
    );
  }
}
