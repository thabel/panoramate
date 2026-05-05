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

    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [payload.userId as string, 'SUPER_ADMIN']
    );

    return user ? (user as any) : null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify SUPER_ADMIN auth
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || '';
    const plan = url.searchParams.get('plan') || '';
    const status = url.searchParams.get('status') || '';

    // Build query conditions
    let whereConditions = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push(
        `(u.email LIKE ? OR u.firstName LIKE ? OR u.lastName LIKE ? OR o.name LIKE ?)`
      );
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (plan) {
      whereConditions.push('o.plan = ?');
      params.push(plan);
    }

    if (status) {
      if (status === 'ACTIVE') {
        whereConditions.push("o.subscriptionStatus = 'ACTIVE'");
      } else if (status === 'INACTIVE') {
        whereConditions.push(
          `(o.subscriptionStatus IN ('CANCELED', 'PAST_DUE', 'INCOMPLETE')
           OR (o.subscriptionStatus = 'TRIALING' AND o.trialEndsAt < NOW()))`
        );
      }
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Get total count
    const [users, countResult]: any = await Promise.all([
      db.query(
        `SELECT u.id, u.email, u.firstName, u.lastName, u.createdAt, u.lastLoginAt,
                o.id as organizationId, o.name as organizationName, o.plan, o.subscriptionStatus,
                o.usedStorageMb, o.totalStorageMb,
                (SELECT COUNT(*) FROM tours WHERE organizationId = o.id) as toursCount
         FROM users u
         LEFT JOIN organizations o ON u.organizationId = o.id
         ${whereClause}
         ORDER BY u.createdAt DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.queryOne(
        `SELECT COUNT(*) as total FROM users u
         LEFT JOIN organizations o ON u.organizationId = o.id
         ${whereClause}`,
        params
      ),
    ]);

    const total = (countResult as any)?.total || 0;

    // Format user response
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      organization: {
        id: user.organizationId,
        name: user.organizationName,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
      },
      usage: {
        tours: user.toursCount || 0,
        storageUsedMb: user.usedStorageMb || 0,
        storageTotalMb: user.totalStorageMb || 0,
        storageUsedGb: parseFloat(((user.usedStorageMb || 0) / 1024).toFixed(2)),
        storageTotalGb: parseFloat(((user.totalStorageMb || 0) / 1024).toFixed(2)),
      },
    }));

    logger.info({
      event: 'super_admin_fetch_users',
      superAdminId: superAdmin.id,
      limit,
      offset,
      total,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          users: formattedUsers,
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
      event: 'admin_fetch_users_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
