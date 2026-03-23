import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const tour = await db.tour.findUnique({
      where: { shareToken: params.shareToken },
      include: {
        images: {
          include: {
            hotspots: true,
          },
          orderBy: { order: 'asc' },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    if (!tour.isPublic) {
      return NextResponse.json(
        { error: 'Tour is not public' },
        { status: 403 }
      );
    }

    // Increment view count
    await db.tour.update({
      where: { id: tour.id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...tour,
          viewCount: tour.viewCount + 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get public tour error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
