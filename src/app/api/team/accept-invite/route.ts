import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, firstName, lastName, password } = body;

    if (!token || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Find invitation with organization
    const invitation: any = await db.queryOne(
      `SELECT i.*, o.id as org_id, o.name as org_name, o.slug as org_slug
       FROM Invitation i
       JOIN Organization o ON i.organizationId = o.id
       WHERE i.token = ?`,
      [token]
    );

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Invitation already accepted' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.queryOne(
      'SELECT * FROM User WHERE email = ?',
      [invitation.email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = require('crypto').randomUUID();
    await db.execute(
      `INSERT INTO User (id, email, password, firstName, lastName, role, organizationId, isVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, invitation.email, hashedPassword, firstName, lastName, invitation.role, invitation.organizationId, true]
    );

    const user = await db.queryOne(
      'SELECT * FROM User WHERE id = ?',
      [userId]
    );

    // Mark invitation as accepted
    await db.execute(
      'UPDATE Invitation SET acceptedAt = NOW() WHERE id = ?',
      [invitation.id]
    );

    return NextResponse.json(
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
            id: invitation.org_id,
            name: invitation.org_name,
            slug: invitation.org_slug,
          },
        },
        message: 'Invitation accepted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
