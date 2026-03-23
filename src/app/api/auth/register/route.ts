import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT, hashPassword, generateSlug, setAuthCookie } from '@/lib/auth';

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
    const existingUser = await db.user.findUnique({
      where: { email },
    });

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

    // Create organization
    const organization = await db.organization.create({
      data: {
        name: organizationName,
        slug,
        plan: 'FREE_TRIAL',
        subscriptionStatus: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        maxTours: 1,
        maxImagesPerTour: 10,
        totalStorageMb: 200,
      },
    });

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'OWNER',
        organizationId: organization.id,
      },
    });

    // Create session
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        organizationId: organization.id,
        role: user.role,
      },
      '7d'
    );

    // Set auth cookie
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: organization.id,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan,
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
