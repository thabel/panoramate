import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveUploadedFile, deleteFile } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tour = await db.queryOne(
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // RESTRICTION DISABLED: all authenticated users can upload logos
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { filename } = await saveUploadedFile(
      Buffer.from(buffer),
      authPayload.organizationId,
      tour.id,
      file.name
    );

    // If there was an old logo, delete it
    if (tour.customLogoUrl) {
      await deleteFile(tour.customLogoUrl);
    }

    await db.execute(
      'UPDATE tours SET customLogoUrl = ?, updatedAt = NOW() WHERE id = ?',
      [filename, params.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        customLogoUrl: filename,
      },
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      'SELECT * FROM tours WHERE id = ?',
      [params.id]
    );

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // RESTRICTION DISABLED: all authenticated users can delete logos
    if (tour.customLogoUrl) {
      await deleteFile(tour.customLogoUrl);
    }

    await db.execute(
      'UPDATE tours SET customLogoUrl = NULL, updatedAt = NOW() WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ success: true, message: 'Logo deleted' });
  } catch (error) {
    console.error('Delete logo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
