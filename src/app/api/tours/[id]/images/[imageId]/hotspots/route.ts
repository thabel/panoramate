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

    const image = await db.queryOne(
      'SELECT * FROM tour_images WHERE id = ?',
      [params.imageId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Get hotspots for this image
    const hotspots: any = await db.query(
      'SELECT * FROM hotspots WHERE imageId = ? ORDER BY createdAt ASC',
      [params.imageId]
    );

    // Parse metadata JSON if needed
    const hotspotsData = hotspots.map((h: any) => ({
      ...h,
      metadata: typeof h.metadata === 'string' ? JSON.parse(h.metadata) : h.metadata,
    }));

    // RESTRICTION DISABLED: all authenticated users can view hotspots
    return NextResponse.json(
      { success: true, data: hotspotsData },
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

    const image = await db.queryOne(
      'SELECT * FROM tour_images WHERE id = ?',
      [params.imageId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can create hotspots
    const hotspotId = require('crypto').randomUUID();
    await db.execute(
      `INSERT INTO hotspots (
        id, imageId, type, yaw, pitch, rotation, targetImageId,
        title, content, url, videoUrl, imageUrl, imageUrls,
        animationType, iconUrl, iconName, color, scale, metadata,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        hotspotId,
        params.imageId,
        type,
        yaw,
        pitch,
        rotation || 0,
        targetImageId || null,
        title || null,
        content || null,
        url || null,
        videoUrl || null,
        imageUrl || null,
        imageUrls || null,
        animationType || 'NONE',
        iconUrl || null,
        iconName || 'info',
        color || null,
        scale || 1.0,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );

    const hotspot: any = await db.queryOne(
      'SELECT * FROM hotspots WHERE id = ?',
      [hotspotId]
    );

    // Parse metadata if it's a string
    if (hotspot.metadata && typeof hotspot.metadata === 'string') {
      hotspot.metadata = JSON.parse(hotspot.metadata);
    }

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

    const hotspot: any = await db.queryOne(
      'SELECT * FROM hotspots WHERE id = ?',
      [hotspotId]
    );

    if (!hotspot) {
      return NextResponse.json(
        { error: 'Hotspot not found' },
        { status: 404 }
      );
    }

    // Parse metadata if it's a string
    if (hotspot.metadata && typeof hotspot.metadata === 'string') {
      hotspot.metadata = JSON.parse(hotspot.metadata);
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
    // Build UPDATE query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (type) {
      updates.push('type = ?');
      values.push(type);
    }
    if (yaw !== undefined) {
      updates.push('yaw = ?');
      values.push(yaw);
    }
    if (pitch !== undefined) {
      updates.push('pitch = ?');
      values.push(pitch);
    }
    if (rotation !== undefined) {
      updates.push('rotation = ?');
      values.push(rotation);
    }
    if (targetImageId !== undefined) {
      updates.push('targetImageId = ?');
      values.push(targetImageId);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (url !== undefined) {
      updates.push('url = ?');
      values.push(url);
    }
    if (videoUrl !== undefined) {
      updates.push('videoUrl = ?');
      values.push(videoUrl);
    }
    if (imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      values.push(imageUrl);
    }
    if (imageUrls !== undefined) {
      updates.push('imageUrls = ?');
      values.push(imageUrls);
    }
    if (animationType) {
      updates.push('animationType = ?');
      values.push(animationType);
    }
    if (iconUrl !== undefined) {
      updates.push('iconUrl = ?');
      values.push(iconUrl);
    }
    if (iconName !== undefined) {
      updates.push('iconName = ?');
      values.push(iconName);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (scale !== undefined) {
      updates.push('scale = ?');
      values.push(scale);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }

    updates.push('updatedAt = NOW()');
    values.push(hotspotId);

    await db.execute(
      `UPDATE hotspots SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedHotspot: any = await db.queryOne(
      'SELECT * FROM hotspots WHERE id = ?',
      [hotspotId]
    );

    // Parse metadata if it's a string
    if (updatedHotspot.metadata && typeof updatedHotspot.metadata === 'string') {
      updatedHotspot.metadata = JSON.parse(updatedHotspot.metadata);
    }

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

    const hotspot = await db.queryOne(
      'SELECT * FROM hotspots WHERE id = ?',
      [hotspotId]
    );

    if (!hotspot) {
      return NextResponse.json(
        { error: 'Hotspot not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can delete hotspots
    await db.execute(
      'DELETE FROM hotspots WHERE id = ?',
      [hotspotId]
    );

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
