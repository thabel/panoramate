import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (user) {
      // Delete all sessions for this user
      await db.session.deleteMany({
        where: { userId: user.userId },
      });
    }

    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );

    response.cookies.delete('token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json(
      { success: true, message: 'Logged out' },
      { status: 200 }
    );
    response.cookies.delete('token');
    return response;
  }
}
