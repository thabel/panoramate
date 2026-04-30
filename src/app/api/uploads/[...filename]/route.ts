import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { getAuthUser } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    // Join path segments
    let fullPath = Array.isArray(params.filename)
      ? params.filename.join('/')
      : params.filename;

    // Security: prevent directory traversal
    if (fullPath.includes('..') || fullPath.startsWith('/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Check if mobile version is requested
    const searchParams = request.nextUrl.searchParams;
    const requestMobile = searchParams.get('mobile') === 'true';

    // Detect mobile device from User-Agent if mobile param not explicitly set
    let isMobileDevice = requestMobile;
    if (!requestMobile && !searchParams.has('mobile')) {
      const userAgent = request.headers.get('user-agent') || '';
      isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    }

    let filepath = join(UPLOAD_DIR, fullPath);

    // Try mobile version first if on mobile device
    let actualPath = filepath;
    if (isMobileDevice && fullPath.includes('.')) {
      const parts = fullPath.split('.');
      const ext = parts.pop();
      const basePath = parts.join('.');
      const mobileFilepath = join(UPLOAD_DIR, `${basePath}-mobile.${ext}`);

      try {
        // Check if mobile version exists
        await access(mobileFilepath);
        actualPath = mobileFilepath;
      } catch {
        // Mobile version doesn't exist, fall back to original
        actualPath = filepath;
      }
    }

    try {
      const buffer = await readFile(actualPath);

      // Determine content type based on original path
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
      console.error('File not found:', actualPath, "err", err);
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
