import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * Admin endpoint to create users via API
 * POST /api/admin/create-user
 * Body: { email, firstName, lastName, password, role, organizationName?, organizationSlug? }
 */

export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE-USER] Request received');

    const body = await request.json();
    console.log('[CREATE-USER] Body parsed:', {
      email: body.email,
      firstName: body.firstName,
      role: body.role,
      organizationName: body.organizationName
    });

    const { email, firstName, lastName, password, role, organizationName, organizationSlug } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !role) {
      console.warn('[CREATE-USER] Missing required fields:', { email, firstName, lastName, role });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'email, firstName, lastName, password, and role are required',
          received: { email: !!email, firstName: !!firstName, lastName: !!lastName, password: !!password, role: !!role }
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(role)) {
      console.warn('[CREATE-USER] Invalid role:', role);
      return NextResponse.json(
        {
          error: 'Invalid role',
          details: `Must be one of: ${validRoles.join(', ')}`,
          received: role
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('[CREATE-USER] Checking if user exists:', email);
    const existingUser = await db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      console.warn('[CREATE-USER] User already exists:', email);
      return NextResponse.json(
        {
          error: 'User already exists',
          details: `A user with email ${email} already exists in the system`
        },
        { status: 409 }
      );
    }

    // Create or get organization
    console.log('[CREATE-USER] Processing organization:', { organizationName, organizationSlug });
    let organization;

    if (organizationName && organizationSlug) {
      // Check if org already exists
      const existingOrg = await db.queryOne(
        'SELECT * FROM organizations WHERE slug = ?',
        [organizationSlug]
      );

      if (existingOrg) {
        console.log('[CREATE-USER] Using existing organization:', organizationSlug);
        organization = existingOrg;
      } else {
        // Create new organization
        console.log('[CREATE-USER] Creating new organization:', organizationName);
        const orgId = uuidv4();
        const now = new Date();
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        await db.execute(
          `INSERT INTO organizations (id, name, slug, plan, subscriptionStatus, trialEndsAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orgId, organizationName, organizationSlug, 'FREE_TRIAL', 'TRIALING', trialEndsAt, now, now]
        );

        organization = await db.queryOne(
          'SELECT * FROM organizations WHERE id = ?',
          [orgId]
        );
        console.log('[CREATE-USER] Organization created:', organization.id);
      }
    } else {
      // Use or create default test organization
      console.log('[CREATE-USER] Using/creating default organization (test-org)');
      const existingTestOrg = await db.queryOne(
        'SELECT * FROM organizations WHERE slug = ?',
        ['test-org']
      );

      if (existingTestOrg) {
        organization = existingTestOrg;
      } else {
        const orgId = uuidv4();
        const now = new Date();
        const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        await db.execute(
          `INSERT INTO organizations (id, name, slug, plan, subscriptionStatus, trialEndsAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orgId, 'Test Organization', 'test-org', 'FREE_TRIAL', 'TRIALING', trialEndsAt, now, now]
        );

        organization = await db.queryOne(
          'SELECT * FROM organizations WHERE id = ?',
          [orgId]
        );
      }
    }

    // Hash password
    console.log('[CREATE-USER] Hashing password');
    const hashedPassword = await hashPassword(password);

    // Create user
    console.log('[CREATE-USER] Creating user:', { email, firstName, role, organizationId: organization.id });
    const userId = uuidv4();
    const now = new Date();

    await db.execute(
      `INSERT INTO users (id, email, password, firstName, lastName, role, isVerified, organizationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, hashedPassword, firstName, lastName, role, true, organization.id, now, now]
    );

    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    console.log('[CREATE-USER] User created successfully:', user.id);

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('[CREATE-USER] ERROR:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });

    return NextResponse.json(
      {
        error: 'Failed to create user',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}
