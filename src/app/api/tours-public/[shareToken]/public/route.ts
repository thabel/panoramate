import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    // Get tour with organization
    const tourRow: any = await db.queryOne(
      `SELECT
        t.*,
        o.id as org_id,
        o.name as org_name,
        o.slug as org_slug,
        o.logoUrl as org_logoUrl
       FROM Tour t
       JOIN Organization o ON t.organizationId = o.id
       WHERE t.shareToken = ?`,
      [params.shareToken]
    );

    if (!tourRow) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    if (!tourRow.isPublic) {
      return NextResponse.json(
        { error: 'Tour is not public' },
        { status: 403 }
      );
    }

    // Get images with hotspots
    const imagesRaw: any = await db.query(
      'SELECT * FROM TourImage WHERE tourId = ? ORDER BY `order` ASC',
      [tourRow.id]
    );

    const images = await Promise.all(
      imagesRaw.map(async (img: any) => {
        const hotspots: any = await db.query(
          'SELECT * FROM Hotspot WHERE imageId = ? ORDER BY createdAt ASC',
          [img.id]
        );
        return {
          ...img,
          hotspots: hotspots.map((h: any) => ({
            ...h,
            metadata: typeof h.metadata === 'string' ? JSON.parse(h.metadata) : h.metadata,
          })),
        };
      })
    );

    const tour = {
      id: tourRow.id,
      title: tourRow.title,
      description: tourRow.description,
      coverImageUrl: tourRow.coverImageUrl,
      status: tourRow.status,
      shareToken: tourRow.shareToken,
      isPublic: tourRow.isPublic,
      viewCount: tourRow.viewCount,
      settings: typeof tourRow.settings === 'string' ? JSON.parse(tourRow.settings) : tourRow.settings,
      organizationId: tourRow.organizationId,
      createdById: tourRow.createdById,
      createdAt: tourRow.createdAt,
      updatedAt: tourRow.updatedAt,
      customLogoUrl: tourRow.customLogoUrl,
      backgroundAudioUrl: tourRow.backgroundAudioUrl,
      backgroundAudioVolume: tourRow.backgroundAudioVolume,
      showSceneMenu: tourRow.showSceneMenu,
      showHotspotTitles: tourRow.showHotspotTitles,
      organization: {
        id: tourRow.org_id,
        name: tourRow.org_name,
        slug: tourRow.org_slug,
        logoUrl: tourRow.org_logoUrl,
      },
      images,
    };

    // Increment view count
    await db.execute(
      'UPDATE Tour SET viewCount = viewCount + 1 WHERE id = ?',
      [tour.id]
    );

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
