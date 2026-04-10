import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function verifyAdminAuth(request: NextRequest) {
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

    // Get user and check if admin
    const user = await db.user.findUnique({
      where: { id: payload.userId as string },
      include: { organization: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request - ids array required' },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Cannot approve more than 100 requests at once' },
        { status: 400 }
      );
    }

    // Validate all IDs exist and are PENDING
    const existingRequests = await db.inscriptionRequest.findMany({
      where: {
        id: { in: ids },
        status: 'PENDING',
      },
    });

    if (existingRequests.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some requests not found or not in PENDING status' },
        { status: 400 }
      );
    }

    // Update all requests to APPROVED
    const updated = await db.inscriptionRequest.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    logger.info({
      event: 'inscription_requests_approved_bulk',
      count: updated.count,
      approvedBy: admin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${updated.count} inscription requests approved`,
        data: {
          count: updated.count,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'admin_approve_bulk_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to approve inscription requests' },
      { status: 500 }
    );
  }
}
