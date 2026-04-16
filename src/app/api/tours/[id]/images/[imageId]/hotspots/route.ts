import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { validateHotspotData, HotspotIconType } from '@/lib/hotspotIconsConfig';

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
    const {
      type,
      yaw,
      pitch,
      rotation,
      targetImageId,
      title,
      content,
      url,
      videoUrl,
      imageUrl,
      imageUrls,
      animationType,
      iconUrl,
      iconName,
      color,
      scale,
      metadata,
    } = body;

    if (!type || yaw === undefined || pitch === undefined) {
      console.error('type, yaw, and pitch are required', { body });
      return NextResponse.json(
        { error: 'type, yaw, and pitch are required' },
        { status: 400 }
      );
    }

    // Validate hotspot data against icon type requirements
    const validation = validateHotspotData(iconName as HotspotIconType, {
      title,
      targetImageId,
      content,
      url,
      videoUrl,
      imageUrls,
    });

    if (!validation.valid) {
      console.error('Validation failed for new hotspot:', validation.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
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
        imageUrls: imageUrls || null,
        animationType: animationType || 'NONE',
        iconUrl: iconUrl || null,
        iconName: iconName || 'info',
        color: color || null,
        scale: scale || 1.0,
        metadata: metadata || null,
      },
    });

    logger.info(
      { hotspotId: hotspot.id, imageId: params.imageId, tourId: params.id, iconName },
      'Hotspot created in database'
    );

    return NextResponse.json(
      { success: true, data: hotspot },
      { status: 201 }
    );
  } catch (error) {
    logger.error({ error, tourId: params.id, imageId: params.imageId }, 'Create hotspot error');
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
    const {
      hotspotId,
      type,
      yaw,
      pitch,
      rotation,
      targetImageId,
      title,
      content,
      url,
      videoUrl,
      imageUrl,
      imageUrls,
      animationType,
      iconUrl,
      iconName,
      color,
      scale,
      metadata,
    } = body;

    if (!hotspotId) {
      console.error('hotspotId is required for update');
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

    // Validate hotspot data against icon type requirements if iconName is being changed
    if (iconName || title || targetImageId || content || url || videoUrl || imageUrls) {
      const finalIconName = iconName || hotspot.iconName;
      const validation = validateHotspotData(finalIconName as HotspotIconType, {
        title: title !== undefined ? title : hotspot.title,
        targetImageId: targetImageId !== undefined ? targetImageId : hotspot.targetImageId,
        content: content !== undefined ? content : hotspot.content,
        url: url !== undefined ? url : hotspot.url,
        videoUrl: videoUrl !== undefined ? videoUrl : hotspot.videoUrl,
        imageUrls: imageUrls !== undefined ? imageUrls : hotspot.imageUrls,
      });

      if (!validation.valid) {
        console.error('Validation failed for hotspot update:', validation.errors);
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors,
          },
          { status: 400 }
        );
      }
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
        ...(imageUrls !== undefined && { imageUrls }),
        ...(animationType && { animationType }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(iconName !== undefined && { iconName }),
        ...(color !== undefined && { color }),
        ...(scale !== undefined && { scale }),
        ...(metadata !== undefined && { metadata }),
      },
    });

    logger.info(
      { hotspotId: updatedHotspot.id, iconName: updatedHotspot.iconName },
      'Hotspot updated'
    );

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

    logger.info({ hotspotId }, 'Hotspot deleted');

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
