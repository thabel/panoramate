import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveGeneralFile, deleteFile } from '@/lib/storage';

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

    // RESTRICTION DISABLED: all authenticated users can upload audio
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'File must be an audio' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { filename } = await saveGeneralFile(
      Buffer.from(buffer),
      authPayload.organizationId,
      tour.id,
      file.name
    );

    // If there was an old audio, delete it
    if (tour.backgroundAudioUrl) {
      await deleteFile(tour.backgroundAudioUrl);
    }

    await db.execute(
      'UPDATE tours SET backgroundAudioUrl = ?, updatedAt = NOW() WHERE id = ?',
      [filename, params.id]
    );

    return NextResponse.json({
      success: true,
      data: {
        backgroundAudioUrl: filename,
      },
    });
  } catch (error) {
    console.error('Upload audio error:', error);
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

    // RESTRICTION DISABLED: all authenticated users can delete audio
    if (tour.backgroundAudioUrl) {
      await deleteFile(tour.backgroundAudioUrl);
    }

    await db.execute(
      'UPDATE tours SET backgroundAudioUrl = NULL, updatedAt = NOW() WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ success: true, message: 'Audio deleted' });
  } catch (error) {
    console.error('Delete audio error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
