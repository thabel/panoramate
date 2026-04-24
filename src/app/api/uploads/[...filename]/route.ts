import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getAuthUser } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    // Join path segments
    const fullPath = Array.isArray(params.filename) 
      ? params.filename.join('/')
      : params.filename; 

    // Security: prevent directory traversal
    if (fullPath.includes('..') || fullPath.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filepath = join(UPLOAD_DIR, fullPath);

    try {
      const buffer = await readFile(filepath);

      // Determine content type
      let contentType = 'image/jpeg';
      if (fullPath.endsWith('.png')) {
        contentType = 'image/png';
      } else if (fullPath.endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (fullPath.endsWith('.gif')) {
        contentType = 'image/gif';
      }

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (err) {
      console.error('File not found:', filepath, "err", err);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
