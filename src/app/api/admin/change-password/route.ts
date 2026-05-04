import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

/**
 * Admin endpoint to change user password
 * POST /api/admin/change-password
 * Body: { email, password }
 */

export async function POST(request: NextRequest) {
  try {
    console.log('[CHANGE-PASSWORD] Request received');

    const body = await request.json();
    const { email, password } = body;

    console.log('[CHANGE-PASSWORD] Body parsed:', { email });

    // Validate required fields
    if (!email || !password) {
      console.warn('[CHANGE-PASSWORD] Missing required fields:', { email, password });

      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'email and password are required',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    console.log('[CHANGE-PASSWORD] Checking user:', email);

    const existingUser = await db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          details: `A user with email ${email} does not exist`,
        },
        { status: 404 }
      );
    }

    // Hash password
    console.log('[CHANGE-PASSWORD] Hashing password');
    const hashedPassword = await hashPassword(password);

    // Update password
    await db.execute(
      `UPDATE users SET password = ?, updatedAt = ? WHERE email = ?`,
      [hashedPassword, new Date(), email]
    );

    console.log('[CHANGE-PASSWORD] Password updated:', email);

    // Fetch organization if exists
    let organization = null;

    if (existingUser.organizationId) {
      organization = await db.queryOne(
        'SELECT * FROM organizations WHERE id = ?',
        [existingUser.organizationId]
      );
    }

    // Return success
    return NextResponse.json(
      {
        success: true,
        data: {
          id: existingUser.id,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role,
          isVerified: existingUser.isVerified,
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                plan: organization.plan,
              }
            : null,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[CHANGE-PASSWORD] ERROR:', error);

    return NextResponse.json(
      {
        error: 'Failed to change password',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}