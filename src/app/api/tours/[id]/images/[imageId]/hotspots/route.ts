import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

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

    if (image.tour.organizationId !== authPayload.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

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
    const { type, yaw, pitch, rotation, targetImageId, title, content, url, videoUrl } = body;

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

    if (image.tour.organizationId !== authPayload.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

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
      },
    });

    return NextResponse.json(
      { success: true, data: hotspot },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create hotspot error:', error);
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
    const { hotspotId, type, yaw, pitch, rotation, targetImageId, title, content, url, videoUrl } = body;

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

    if (hotspot.image.tour.organizationId !== authPayload.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

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

    if (hotspot.image.tour.organizationId !== authPayload.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

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
