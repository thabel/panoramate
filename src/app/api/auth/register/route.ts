import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT, hashPassword, generateSlug } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, organizationName } = body;

    // Validate inputs
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.queryOne('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate organization slug
    const slug = generateSlug(organizationName);
    const organizationId = uuidv4();
    const userId = uuidv4();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Use transaction to create organization and user
    await db.transaction(async (connection) => {
      // Create organization
      await connection.execute(
        `INSERT INTO organizations (id, name, slug, plan, subscriptionStatus, trialEndsAt, maxTours, maxImagesPerTour, totalStorageMb, usedStorageMb, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [organizationId, organizationName, slug, 'FREE_TRIAL', 'TRIALING', trialEndsAt, 1, 10, 200, 0]
      );

      // Create user
      await connection.execute(
        `INSERT INTO users (id, email, password, firstName, lastName, role, organizationId, createdAt, updatedAt, isVerified)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
        [userId, email, hashedPassword, firstName, lastName, 'ADMIN', organizationId, false]
      );
    });

    // Create session token
    const token = await signJWT(
      {
        userId,
        email,
        organizationId,
        role: 'ADMIN',
      },
      '7d'
    );

    // Set auth cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userId,
            email,
            firstName,
            lastName,
            role: 'ADMIN',
            organizationId,
          },
          organization: {
            id: organizationId,
            name: organizationName,
            slug,
            plan: 'FREE_TRIAL',
          },
          token,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
