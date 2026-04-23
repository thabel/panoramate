import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveUploadedFile, deleteFile } from '@/lib/storage';
import { PLAN_LIMITS } from '@/lib/stripe';
import { canAddImagesToTour, canAddStorage } from '@/lib/plan-limits';
import { canAccessTour, canAccessImage, logAuditEvent } from '@/lib/access-control';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tour exists and is owned by user's org
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

    // Get tour images count
    const imagesCountResult: any = await db.queryOne(
      'SELECT COUNT(*) as count FROM TourImage WHERE tourId = ?',
      [params.id]
    );
    const tourImagesCount = imagesCountResult?.count || 0;

    // Check if user can access this tour (organization isolation + VIEWER read-only)
    const accessCheck = await canAccessTour(authPayload, params.id, 'write');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }

    const org = await db.queryOne(
      'SELECT * FROM Organization WHERE id = ?',
      [authPayload.organizationId]
    );

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Check image count limit before processing
    const canAddImages = await canAddImagesToTour(authPayload, params.id, files.length);
    if (!canAddImages.allowed) {
      return NextResponse.json(
        { error: canAddImages.reason || 'Cannot add images' },
        { status: 403 }
      );
    }

    const createdImages: any[] = [];
    let totalStorageAdded = 0;

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      try {
        const { filename, width, height, sizeMb } = await saveUploadedFile(
          Buffer.from(uint8Array),
          org.id,
          tour.id,
          file.name
        );

        // Check storage limit
        const canAddStorageResult = await canAddStorage(authPayload, org.usedStorageMb + totalStorageAdded + sizeMb);
        if (!canAddStorageResult.allowed) {
          return NextResponse.json(
            { error: canAddStorageResult.reason || 'Storage limit exceeded' },
            { status: 403 }
          );
        }

        totalStorageAdded += sizeMb;
        const order = tourImagesCount + createdImages.length;

        // Create image
        const imageId = require('crypto').randomUUID();
        await db.execute(
          `INSERT INTO TourImage (
            id, tourId, filename, originalName, mimeType, sizeMb,
            width, height, \`order\`, title, initialYaw, initialPitch, initialFov, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            imageId,
            tour.id,
            filename,
            file.name,
            file.type,
            sizeMb,
            width,
            height,
            order,
            file.name.split('.')[0],
            0, // initialYaw
            0, // initialPitch
            90, // initialFov
          ]
        );

        // Update organization storage
        await db.execute(
          'UPDATE Organization SET usedStorageMb = usedStorageMb + ? WHERE id = ?',
          [sizeMb, org.id]
        );

        // Fetch created image
        const image = await db.queryOne(
          'SELECT * FROM TourImage WHERE id = ?',
          [imageId]
        );

        createdImages.push(image);
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }

    if (createdImages.length === 0) {
      return NextResponse.json(
        { error: 'No images were successfully uploaded' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: createdImages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload images error:', error);
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

    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    const image: any = await db.queryOne(
      `SELECT ti.*, t.organizationId
       FROM TourImage ti
       JOIN Tour t ON ti.tourId = t.id
       WHERE ti.id = ?`,
      [imageId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can delete images
    // Delete file
    await deleteFile(image.filename);

    // Update organization storage
    await db.execute(
      'UPDATE Organization SET usedStorageMb = usedStorageMb - ? WHERE id = ?',
      [image.sizeMb, image.organizationId]
    );

    // Delete hotspots first
    await db.execute(
      'DELETE FROM Hotspot WHERE imageId = ?',
      [imageId]
    );

    // Delete image
    await db.execute(
      'DELETE FROM TourImage WHERE id = ?',
      [imageId]
    );

    return NextResponse.json(
      { success: true, message: 'Image deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete image error:', error);
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

    const body = await request.json();
    const { imageId, title, initialYaw, initialPitch, initialFov } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'imageId is required' },
        { status: 400 }
      );
    }

    const image = await db.queryOne(
      'SELECT * FROM TourImage WHERE id = ?',
      [imageId]
    );

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can update images
    // Build UPDATE query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (initialYaw !== undefined) {
      updates.push('initialYaw = ?');
      values.push(initialYaw);
    }
    if (initialPitch !== undefined) {
      updates.push('initialPitch = ?');
      values.push(initialPitch);
    }
    if (initialFov !== undefined) {
      updates.push('initialFov = ?');
      values.push(initialFov);
    }

    if (updates.length > 0) {
      values.push(imageId);
      await db.execute(
        `UPDATE TourImage SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updatedImage = await db.queryOne(
      'SELECT * FROM TourImage WHERE id = ?',
      [imageId]
    );

    return NextResponse.json(
      {
        success: true,
        data: updatedImage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
