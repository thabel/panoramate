import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { PLAN_LIMITS } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { canCreateTour } from '@/lib/plan-limits';

export async function GET(request: NextRequest) {
  try {
    logger.debug("Received GET /api/tours request");
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    // Filter by organization (only see tours in user's organization)
    const where: any = {
      organizationId: authPayload.organizationId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [tours, total] = await Promise.all([
      db.tour.findMany({
        where,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1, // Only first image for thumbnail
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.tour.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          tours,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get tours error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, settings } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get organization
    const org = await db.organization.findUnique({
      where: { id: authPayload.organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check plan limits
    const canCreate = await canCreateTour(authPayload);
    if (!canCreate.allowed) {
      return NextResponse.json(
        { error: canCreate.reason || 'Cannot create tour' },
        { status: 403 }
      );
    }

    const tour = await db.tour.create({
      data: {
        title,
        description: description || null,
        status: 'DRAFT',
        settings: settings || {
          autorotate: true,
          mouseViewMode: 'drag',
          showControls: true,
        },
        organizationId: authPayload.organizationId,
        createdById: authPayload.userId,
      },
      include: {
        images: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: tour,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create tour error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
