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
    const user = await db.queryOne(
      `SELECT u.*, o.id as org_id, o.name as org_name, o.slug as org_slug, o.plan as org_plan
       FROM users u
       LEFT JOIN organizations o ON u.organizationId = o.id
       WHERE u.id = ?`,
      [payload.userId as string]
    );

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }

    // Transform to match Prisma structure
    const userWithOrg = {
      ...user,
      organization: user.org_id ? {
        id: user.org_id,
        name: user.org_name,
        slug: user.org_slug,
        plan: user.org_plan
      } : null
    };

    return userWithOrg;
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
    const [requests, countResult]: any = await Promise.all([
      db.query(
        `SELECT * FROM inscription_requests
         WHERE status = ?
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      ),
      db.queryOne(
        'SELECT COUNT(*) as total FROM inscription_requests WHERE status = ?',
        [status]
      ),
    ]);

    const total = countResult?.total || 0;

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
