import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { canAccessTour, logAuditEvent } from '@/lib/access-control';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tour with images, hotspots, and creator
    const tourRow: any = await db.queryOne(
      `SELECT
        t.*,
        u.id as createdBy_id,
        u.firstName as createdBy_firstName,
        u.lastName as createdBy_lastName,
        u.email as createdBy_email
       FROM Tour t
       JOIN User u ON t.createdById = u.id
       WHERE t.id = ?`,
      [params.id]
    );

    if (!tourRow) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Get images with hotspots
    const imagesRaw: any = await db.query(
      'SELECT * FROM TourImage WHERE tourId = ? ORDER BY `order` ASC',
      [params.id]
    );

    // Get all hotspots for these images
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
      ...tourRow,
      settings: typeof tourRow.settings === 'string' ? JSON.parse(tourRow.settings) : tourRow.settings,
      createdBy: {
        id: tourRow.createdBy_id,
        firstName: tourRow.createdBy_firstName,
        lastName: tourRow.createdBy_lastName,
        email: tourRow.createdBy_email,
      },
      images,
    };

    // Check if user has access to this tour (organization isolation)
    const accessCheck = await canAccessTour(authPayload, params.id, 'read');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: true, data: tour },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get tour error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tour = await db.queryOne(
      'SELECT * FROM Tour WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tour (organization isolation + VIEWER read-only)
    const accessCheck = await canAccessTour(authPayload, params.id, 'write');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, status, settings, customLogoUrl, backgroundAudioUrl, backgroundAudioVolume, showSceneMenu, showHotspotTitles } = body;

    // Build UPDATE query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (settings) {
      updates.push('settings = ?');
      values.push(JSON.stringify(settings));
    }
    if (customLogoUrl !== undefined) {
      updates.push('customLogoUrl = ?');
      values.push(customLogoUrl);
    }
    if (backgroundAudioUrl !== undefined) {
      updates.push('backgroundAudioUrl = ?');
      values.push(backgroundAudioUrl);
    }
    if (backgroundAudioVolume !== undefined) {
      updates.push('backgroundAudioVolume = ?');
      values.push(backgroundAudioVolume);
    }
    if (showSceneMenu !== undefined) {
      updates.push('showSceneMenu = ?');
      values.push(showSceneMenu);
    }
    if (showHotspotTitles !== undefined) {
      updates.push('showHotspotTitles = ?');
      values.push(showHotspotTitles);
    }

    updates.push('updatedAt = NOW()');
    values.push(params.id);

    await db.execute(
      `UPDATE Tour SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated tour with images and hotspots
    const updatedTourRow: any = await db.queryOne(
      'SELECT * FROM Tour WHERE id = ?',
      [params.id]
    );

    const imagesRaw: any = await db.query(
      'SELECT * FROM TourImage WHERE tourId = ? ORDER BY `order` ASC',
      [params.id]
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

    const updatedTour = {
      ...updatedTourRow,
      settings: typeof updatedTourRow.settings === 'string' ? JSON.parse(updatedTourRow.settings) : updatedTourRow.settings,
      images,
    };

    // Log audit event
    await logAuditEvent(
      authPayload.userId,
      'UPDATE_TOUR',
      'Tour',
      params.id,
      { title, status }
    );

    return NextResponse.json(
      { success: true, data: updatedTour },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update tour error:', error);
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
      'SELECT * FROM Tour WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this tour (organization isolation + VIEWER read-only)
    const accessCheck = await canAccessTour(authPayload, params.id, 'write');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }

    // Get all images to delete files
    const images: any = await db.query(
      'SELECT * FROM TourImage WHERE tourId = ?',
      [params.id]
    );

    // Delete all images and files
    for (const image of images) {
      await deleteFile(image.filename);
    }

    // Delete hotspots first (foreign key constraint)
    await db.execute(
      'DELETE FROM Hotspot WHERE imageId IN (SELECT id FROM TourImage WHERE tourId = ?)',
      [params.id]
    );

    // Delete images
    await db.execute(
      'DELETE FROM TourImage WHERE tourId = ?',
      [params.id]
    );

    // Delete tour
    await db.execute(
      'DELETE FROM Tour WHERE id = ?',
      [params.id]
    );

    // Log audit event
    await logAuditEvent(
      authPayload.userId,
      'DELETE_TOUR',
      'Tour',
      params.id,
      { title: tour.id }
    );

    return NextResponse.json(
      { success: true, message: 'Tour deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete tour error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
