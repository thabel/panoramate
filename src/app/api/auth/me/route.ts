import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);

    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.queryOne(
      `SELECT u.*, o.id as org_id, o.name, o.slug, o.plan, o.subscriptionStatus, o.trialEndsAt, o.currentPeriodEnd, o.maxTours, o.maxImagesPerTour, o.totalStorageMb, o.usedStorageMb
       FROM users u
       LEFT JOIN organizations o ON u.organizationId = o.id
       WHERE u.id = ?`,
      [authPayload.userId]
    ) as any;

    if (!result) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: result.id,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            role: result.role,
            organizationId: result.organizationId,
            avatarUrl: result.avatarUrl,
          },
          organization: {
            id: result.org_id,
            name: result.name,
            slug: result.slug,
            plan: result.plan,
            subscriptionStatus: result.subscriptionStatus,
            trialEndsAt: result.trialEndsAt,
            currentPeriodEnd: result.currentPeriodEnd,
            maxTours: result.maxTours,
            maxImagesPerTour: result.maxImagesPerTour,
            totalStorageMb: result.totalStorageMb,
            usedStorageMb: result.usedStorageMb,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
