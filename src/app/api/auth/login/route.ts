import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT, comparePassword } from '@/lib/auth';
import { User, Organization } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user with organization
    const user = await db.queryOne(
      `SELECT u.*, o.id as org_id, o.name, o.slug, o.plan
       FROM users u
       LEFT JOIN organizations o ON u.organizationId = o.id
       WHERE u.email = ?`,
      [email]
    ) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await db.execute('UPDATE users SET lastLoginAt = NOW() WHERE id = ?', [user.id]);

    // Create session token
    const token = await signJWT(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      },
      '7d'
    );

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
            organizationId: user.organizationId,
          },
          organization: {
            id: user.org_id,
            name: user.name,
            slug: user.slug,
            plan: user.plan,
          },
          token,
        },
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
