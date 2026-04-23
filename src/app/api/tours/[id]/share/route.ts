import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can view share info
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `${protocol}://${host}`;
    
    const shareLink = `${baseUrl}/tour/${tour.shareToken}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          isPublic: tour.isPublic,
          shareToken: tour.shareToken,
          shareLink,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can create share links
    // Generate new share token and make public
    const newShareToken = uuidv4();
    await db.execute(
      'UPDATE tours SET isPublic = ?, shareToken = ?, updatedAt = NOW() WHERE id = ?',
      [true, newShareToken, params.id]
    );

    const updatedTour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `${protocol}://${host}`;
    
    const shareLink = `${baseUrl}/tour/${updatedTour.shareToken}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          isPublic: updatedTour.isPublic,
          shareToken: updatedTour.shareToken,
          shareLink,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can revoke share links
    // Make private and generate new token
    const newShareToken = uuidv4();
    await db.execute(
      'UPDATE tours SET isPublic = ?, shareToken = ?, updatedAt = NOW() WHERE id = ?',
      [false, newShareToken, params.id]
    );

    const updatedTour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          isPublic: updatedTour.isPublic,
          shareToken: updatedTour.shareToken,
          shareLink: null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Revoke share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
