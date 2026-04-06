import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function POST(
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
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const org = await db.organization.findUnique({
      where: { id: authPayload.organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      const ext = file.name.split('.').pop() || '';
      const filename = `${uuidv4()}.${ext}`;
      const relativePath = `${org.id}/${tour.id}/hotspots/${filename}`;
      const filepath = join(UPLOAD_DIR, relativePath);

      const dirPath = dirname(filepath);
      await mkdir(dirPath, { recursive: true });
      await writeFile(filepath, Buffer.from(uint8Array));

      uploadedFiles.push(relativePath);
    }

    return NextResponse.json({
      success: true,
      data: {
        urls: uploadedFiles,
        fullUrls: uploadedFiles.map(url => `/api/uploads/${url}`)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Hotspot upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
