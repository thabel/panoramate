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

    // Check if user can access this tour (organization isolation + VIEWER read-only)
    const accessCheck = await canAccessTour(authPayload, params.id, 'write');
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || 'Access denied' },
        { status: 403 }
      );
    }

    const org = await db.organization.findUnique({
      where: { id: authPayload.organizationId },
    });

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
        const order = tour.images.length + createdImages.length;

        const image = await db.tourImage.create({
          data: {
            tourId: tour.id,
            filename,
            originalName: file.name,
            mimeType: file.type,
            sizeMb,
            width,
            height,
            order,
            title: file.name.split('.')[0],
          },
        });

        // Update organization storage
        await db.organization.update({
          where: { id: org.id },
          data: {
            usedStorageMb: org.usedStorageMb + sizeMb,
          },
        });

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

    const image = await db.tourImage.findUnique({
      where: { id: imageId },
      include: { tour: true },
    });

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
    await db.organization.update({
      where: { id: image.tour.organizationId },
      data: {
        usedStorageMb: {
          decrement: image.sizeMb,
        },
      },
    });

    // Delete image (cascade will delete hotspots)
    await db.tourImage.delete({
      where: { id: imageId },
    });

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

    const image = await db.tourImage.findUnique({
      where: { id: imageId },
      include: { tour: true },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // RESTRICTION DISABLED: all authenticated users can update images
    const updatedImage = await db.tourImage.update({
      where: { id: imageId },
      data: {
        title: title !== undefined ? title : undefined,
        initialYaw: initialYaw !== undefined ? initialYaw : undefined,
        initialPitch: initialPitch !== undefined ? initialPitch : undefined,
        initialFov: initialFov !== undefined ? initialFov : undefined,
      },
    });

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
