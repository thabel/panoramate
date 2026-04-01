import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10);

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
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Check organization exists
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
    const file = formData.get('icon') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No icon file provided' },
        { status: 400 }
      );
    }

    // Validate file type (SVG or PNG)
    if (!['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Only SVG, PNG, JPEG, and GIF icons are allowed' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const sizeMb = buffer.byteLength / (1024 * 1024);

    // Validate file size (icons should be small, max 5MB)
    if (sizeMb > 5) {
      return NextResponse.json(
        { error: 'Icon file size must not exceed 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'svg';
    const filename = `${uuidv4()}.${ext}`;
    const filepath = join(UPLOAD_DIR, org.id, tour.id, 'icons', filename);

    // Ensure directory exists
    const dirPath = dirname(filepath);
    await mkdir(dirPath, { recursive: true });

    // Save file
    await writeFile(filepath, Buffer.from(uint8Array));

    const iconUrl = `${org.id}/${tour.id}/icons/${filename}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          iconUrl,
          filename,
          url: `/api/uploads/${iconUrl}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload icon error:', error);
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
    const { iconUrl } = body;

    if (!iconUrl) {
      return NextResponse.json(
        { error: 'iconUrl is required' },
        { status: 400 }
      );
    }

    // Check tour exists
    const tour = await db.tour.findUnique({
      where: { id: params.id },
    });

    if (!tour) {
      return NextResponse.json(
        { error: 'Tour not found' },
        { status: 404 }
      );
    }

    // Delete file
    await deleteFile(iconUrl);

    return NextResponse.json(
      { success: true, message: 'Icon deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete icon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
