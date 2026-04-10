import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = verified.payload.userId as string;

    // Get user and check if admin
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || user.role !== 'OWNER') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin auth
    const admin = await verifyAdminAuth(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the inscription request
    const inscriptionRequest = await db.inscriptionRequest.findUnique({
      where: { id },
    });

    if (!inscriptionRequest) {
      return NextResponse.json(
        { error: 'Inscription request not found' },
        { status: 404 }
      );
    }

    // Update status to APPROVED
    const updated = await db.inscriptionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    logger.info({
      event: 'inscription_request_approved',
      id,
      email: updated.email,
      approvedBy: admin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription request approved',
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'inscription_approval_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to approve inscription request' },
      { status: 500 }
    );
  }
}
