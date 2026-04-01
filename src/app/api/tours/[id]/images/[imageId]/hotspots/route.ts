import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const image = await db.tourImage.findUnique({
      where: { id: params.imageId },
      include: {
        tour: true,
        hotspots: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can view hotspots
    return NextResponse.json(
      { success: true, data: image.hotspots },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get hotspots error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, yaw, pitch, rotation, targetImageId, title, content, url, videoUrl, imageUrl, animationType, iconUrl, color, scale } = body;

    if (!type || yaw === undefined || pitch === undefined) {
      return NextResponse.json(
        { error: 'type, yaw, and pitch are required' },
        { status: 400 }
      );
    }

    const image = await db.tourImage.findUnique({
      where: { id: params.imageId },
      include: { tour: true },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can create hotspots
    const hotspot = await db.hotspot.create({
      data: {
        imageId: params.imageId,
        type,
        yaw,
        pitch,
        rotation: rotation || 0,
        targetImageId: targetImageId || null,
        title: title || null,
        content: content || null,
        url: url || null,
        videoUrl: videoUrl || null,
        imageUrl: imageUrl || null,
        animationType: animationType || 'NONE',
        iconUrl: iconUrl || null,
        color: color || null,
        scale: scale || 1.0,
      },
    });

    logger.info({ hotspotId: hotspot.id, imageId: params.imageId, tourId: params.id }, 'Hotspot created in database');

    return NextResponse.json(
      { success: true, data: hotspot },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error, tourId: params.id, imageId: params.imageId }, 'Create hotspot error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hotspotId, type, yaw, pitch, rotation, targetImageId, title, content, url, videoUrl, imageUrl, animationType, iconUrl, color, scale } = body;

    if (!hotspotId) {
      return NextResponse.json(
        { error: 'hotspotId is required' },
        { status: 400 }
      );
    }

    const hotspot = await db.hotspot.findUnique({
      where: { id: hotspotId },
      include: {
        image: {
          include: { tour: true },
        },
      },
    });

    if (!hotspot) {
      return NextResponse.json(
        { error: 'Hotspot not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can update hotspots
    const updatedHotspot = await db.hotspot.update({
      where: { id: hotspotId },
      data: {
        ...(type && { type }),
        ...(yaw !== undefined && { yaw }),
        ...(pitch !== undefined && { pitch }),
        ...(rotation !== undefined && { rotation }),
        ...(targetImageId !== undefined && { targetImageId }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(url !== undefined && { url }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(animationType && { animationType }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(color !== undefined && { color }),
        ...(scale !== undefined && { scale }),
      },
    });

    return NextResponse.json(
      { success: true, data: updatedHotspot },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update hotspot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hotspotId } = body;

    if (!hotspotId) {
      return NextResponse.json(
        { error: 'hotspotId is required' },
        { status: 400 }
      );
    }

    const hotspot = await db.hotspot.findUnique({
      where: { id: hotspotId },
      include: {
        image: {
          include: { tour: true },
        },
      },
    });

    if (!hotspot) {
      return NextResponse.json(
        { error: 'Hotspot not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can delete hotspots
    await db.hotspot.delete({
      where: { id: hotspotId },
    });

    return NextResponse.json(
      { success: true, message: 'Hotspot deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete hotspot error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
