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

    const tour = await db.tour.findUnique({
      where: { id: params.id },
      include: {
        images: {
          include: {
            hotspots: true,
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    const tour = await db.tour.findUnique({
      where: { id: params.id },
    });

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

    const updatedTour = await db.tour.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(settings && { settings }),
        ...(customLogoUrl !== undefined && { customLogoUrl }),
        ...(backgroundAudioUrl !== undefined && { backgroundAudioUrl }),
        ...(backgroundAudioVolume !== undefined && { backgroundAudioVolume }),
        ...(showSceneMenu !== undefined && { showSceneMenu }),
        ...(showHotspotTitles !== undefined && { showHotspotTitles }),
      },
      include: {
        images: {
          include: { hotspots: true },
          orderBy: { order: 'asc' },
        },
      },
    });

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

    const tour = await db.tour.findUnique({
      where: { id: params.id },
      include: { images: true },
    });

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

    // Delete all images and files
    for (const image of tour.images) {
      await deleteFile(image.filename);
    }

    // Delete tour (cascade will delete images and hotspots)
    await db.tour.delete({
      where: { id: params.id },
    });

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
