import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function verifySuperAdminAuth(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');

    let tokenToVerify = token;
    if (authHeader?.startsWith('Bearer ')) {
      tokenToVerify = authHeader.slice(7);
    }

    if (!tokenToVerify) {
      return null;
    }

    const payload = await verifyJWT(tokenToVerify);
    if (!payload || !payload.userId) {
      return null;
    }

    // Get user and check if SUPER_ADMIN (only SUPER_ADMIN can manage inscriptions)
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      include: { organization: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN auth (only SUPER_ADMIN can view inscriptions)
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'PENDING';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch inscription requests
    const [requests, total] = await Promise.all([
      db.inscriptionRequest.findMany({
        where: {
          status: status as any,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.inscriptionRequest.count({
        where: {
          status: status as any,
        },
      }),
    ]);

    logger.info({
      event: 'super_admin_fetch_inscriptions',
      superAdminId: superAdmin.id,
      status,
      count: requests.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          requests,
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'admin_fetch_inscriptions_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to fetch inscription requests' },
      { status: 500 }
    );
  }
}
