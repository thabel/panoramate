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

    const [members, pendingInvitations] = await Promise.all([
      db.user.findMany({
        where: { organizationId: authPayload.organizationId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      db.invitation.findMany({
        where: {
          organizationId: authPayload.organizationId,
          acceptedAt: null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
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

    // RESTRICTION DISABLED: all users can invite members (role checks removed)
    const body = await request.json();
    const { email, role = 'MEMBER' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in org
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.organizationId === authPayload.organizationId) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email,
        organizationId: authPayload.organizationId,
        acceptedAt: null,
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Create invitation
    const token = uuidv4();
    const invitation = await db.invitation.create({
      data: {
        email,
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        organizationId: authPayload.organizationId,
        invitedById: authPayload.userId,
      },
    });

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
