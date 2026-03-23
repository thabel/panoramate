import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);

    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: authPayload.userId },
      include: { organization: true },
    });

    if (!user) {
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
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            organizationId: user.organizationId,
            avatarUrl: user.avatarUrl,
          },
          organization: {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            plan: user.organization.plan,
            subscriptionStatus: user.organization.subscriptionStatus,
            trialEndsAt: user.organization.trialEndsAt,
            currentPeriodEnd: user.organization.currentPeriodEnd,
            maxTours: user.organization.maxTours,
            maxImagesPerTour: user.organization.maxImagesPerTour,
            totalStorageMb: user.organization.totalStorageMb,
            usedStorageMb: user.organization.usedStorageMb,
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
