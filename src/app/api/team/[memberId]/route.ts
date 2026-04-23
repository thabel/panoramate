import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RESTRICTION DISABLED: all users can manage members (role checks removed)
    const member = await db.queryOne(
      'SELECT * FROM User WHERE id = ?',
      [params.memberId]
    );

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: organization check removed, owner protection removed

    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    await db.execute(
      'UPDATE User SET role = ? WHERE id = ?',
      [role, params.memberId]
    );

    const updatedMember = await db.queryOne(
      'SELECT id, email, firstName, lastName, role, createdAt FROM User WHERE id = ?',
      [params.memberId]
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RESTRICTION DISABLED: all users can remove members (role checks removed)
    const member = await db.queryOne(
      'SELECT * FROM User WHERE id = ?',
      [params.memberId]
    );

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: organization check, owner protection, and self-removal protection all removed

    await db.execute(
      'DELETE FROM User WHERE id = ?',
      [params.memberId]
    );

    return NextResponse.json(
      { success: true, message: 'Member removed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
