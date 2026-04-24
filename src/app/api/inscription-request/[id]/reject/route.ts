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

    // Get user and check if SUPER_ADMIN (only SUPER_ADMIN can reject inscriptions)
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify SUPER_ADMIN auth (only SUPER_ADMIN can reject inscriptions)
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rejectionReason } = body;

    const { id } = params;

    // Get the inscription request
    const inscriptionRequest = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE id = ?',
      [id]
    );

    if (!inscriptionRequest) {
      return NextResponse.json(
        { error: 'Inscription request not found' },
        { status: 404 }
      );
    }

    if (inscriptionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only reject PENDING requests' },
        { status: 400 }
      );
    }

    // Update status to REJECTED
    const now = new Date();
    await db.execute(
      'UPDATE inscription_requests SET status = ?, rejectionReason = ?, updatedAt = ? WHERE id = ?',
      ['REJECTED', rejectionReason || null, now, id]
    );

    const updated = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE id = ?',
      [id]
    );

    logger.info({
      event: 'inscription_request_rejected',
      id,
      email: updated.email,
      rejectedBy: superAdmin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription request rejected',
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'inscription_rejection_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to reject inscription request' },
      { status: 500 }
    );
  }
}
