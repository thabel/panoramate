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

    // Get user and check if SUPER_ADMIN (only SUPER_ADMIN can approve inscriptions)
    const user = await db.queryOne(
      `SELECT u.*, o.id as org_id, o.name, o.slug, o.plan
       FROM users u
       LEFT JOIN organizations o ON u.organizationId = o.id
       WHERE u.id = ?`,
      [payload.userId as string]
    ) as any;

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN auth (only SUPER_ADMIN can approve inscriptions)
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
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
    const placeholders = ids.map(() => '?').join(',');
    const existingRequests = await db.query(
      `SELECT id FROM inscription_requests WHERE id IN (${placeholders}) AND status = 'PENDING'`,
      ids
    ) as any[];

    if (existingRequests.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some requests not found or not in PENDING status' },
        { status: 400 }
      );
    }

    // Update all requests to APPROVED
    const updatePlaceholders = ids.map(() => '?').join(',');
    await db.execute(
      `UPDATE inscription_requests SET status = 'APPROVED', approvedAt = NOW(), updatedAt = NOW() WHERE id IN (${updatePlaceholders})`,
      ids
    );

    logger.info({
      event: 'inscription_requests_approved_bulk',
      count: ids.length,
      approvedBy: superAdmin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `${ids.length} inscription requests approved`,
        data: {
          count: ids.length,
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
