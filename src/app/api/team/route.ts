import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [members, pendingInvitations]: any = await Promise.all([
      db.query(
        `SELECT id, email, firstName, lastName, role, avatarUrl, createdAt
         FROM users
         WHERE organizationId = ?
         ORDER BY createdAt ASC`,
        [authPayload.organizationId]
      ),
      db.query(
        `SELECT id, email, role, createdAt, expiresAt
         FROM invitations
         WHERE organizationId = ? AND acceptedAt IS NULL
         ORDER BY createdAt DESC`,
        [authPayload.organizationId]
      ),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          members,
          pendingInvitations,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and MEMBER can invite (VIEWER cannot invite)
  if (authPayload.role !== 'ADMIN' && authPayload.role !== 'MEMBER' &&  authPayload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You do not have permission to invite members' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = 'MEMBER' } = body;


    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in org
    const existingUser = await db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser && existingUser.organizationId === authPayload.organizationId) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await db.queryOne(
      `SELECT * FROM invitations
       WHERE email = ? AND organizationId = ? AND acceptedAt IS NULL`,
      [email, authPayload.organizationId]
    );

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation
    const token = uuidv4();
    const invitationId = require('crypto').randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.execute(
      `INSERT INTO invitations (id, email, role, token, expiresAt, organizationId, invitedById, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [invitationId, email, role, token, expiresAt, authPayload.organizationId, authPayload.userId]
    );

    const invitation = await db.queryOne(
      'SELECT * FROM invitations WHERE id = ?',
      [invitationId]
    );

    // TODO: Send email with invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/join?token=${token}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          invitation,
          invitationUrl,
        },
        message: `Invitation sent to ${email}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invite member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
