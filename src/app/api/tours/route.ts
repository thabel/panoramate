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

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['t.organizationId = ?'];
    const params: any[] = [authPayload.organizationId];

    if (search) {
      whereConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get tours with first image and creator info
    const toursQuery = `
      SELECT
        t.*,
        u.firstName as createdBy_firstName,
        u.lastName as createdBy_lastName,
        u.email as createdBy_email,
        ti.id as firstImage_id,
        ti.filename as firstImage_filename,
        ti.originalName as firstImage_originalName,
        ti.mimeType as firstImage_mimeType,
        ti.sizeMb as firstImage_sizeMb,
        ti.width as firstImage_width,
        ti.height as firstImage_height,
        ti.order as firstImage_order,
        ti.title as firstImage_title,
        ti.initialYaw as firstImage_initialYaw,
        ti.initialPitch as firstImage_initialPitch,
        ti.initialFov as firstImage_initialFov,
        ti.createdAt as firstImage_createdAt,
        ti.tourId as firstImage_tourId
      FROM Tour t
      LEFT JOIN User u ON t.createdById = u.id
      LEFT JOIN (
        SELECT ti1.*
        FROM TourImage ti1
        INNER JOIN (
          SELECT tourId, MIN(\`order\`) as minOrder
          FROM TourImage
          GROUP BY tourId
        ) ti2 ON ti1.tourId = ti2.tourId AND ti1.\`order\` = ti2.minOrder
      ) ti ON t.id = ti.tourId
      WHERE ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM Tour t
      WHERE ${whereClause}
    `;

    const [toursRaw, countResult]: any = await Promise.all([
      db.query(toursQuery, [...params, limit, offset]),
      db.queryOne(countQuery, params),
    ]);

    // Transform results to match Prisma structure
    const tours = toursRaw.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      coverImageUrl: row.coverImageUrl,
      status: row.status,
      shareToken: row.shareToken,
      isPublic: row.isPublic,
      viewCount: row.viewCount,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
      organizationId: row.organizationId,
      createdById: row.createdById,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      customLogoUrl: row.customLogoUrl,
      backgroundAudioUrl: row.backgroundAudioUrl,
      backgroundAudioVolume: row.backgroundAudioVolume,
      showSceneMenu: row.showSceneMenu,
      showHotspotTitles: row.showHotspotTitles,
      createdBy: {
        firstName: row.createdBy_firstName,
        lastName: row.createdBy_lastName,
        email: row.createdBy_email,
      },
      images: row.firstImage_id ? [{
        id: row.firstImage_id,
        tourId: row.firstImage_tourId,
        filename: row.firstImage_filename,
        originalName: row.firstImage_originalName,
        mimeType: row.firstImage_mimeType,
        sizeMb: row.firstImage_sizeMb,
        width: row.firstImage_width,
        height: row.firstImage_height,
        order: row.firstImage_order,
        title: row.firstImage_title,
        initialYaw: row.firstImage_initialYaw,
        initialPitch: row.firstImage_initialPitch,
        initialFov: row.firstImage_initialFov,
        createdAt: row.firstImage_createdAt,
      }] : [],
    }));

    const total = countResult?.total || 0;

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
    const org = await db.queryOne(
      'SELECT * FROM Organization WHERE id = ?',
      [authPayload.organizationId]
    );

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

    // Generate shareToken (random string)
    const crypto = require('crypto');
    const shareToken = crypto.randomBytes(16).toString('hex');

    // Create tour
    const tourId = crypto.randomUUID();
    const settingsJson = JSON.stringify(settings || {
      autorotate: true,
      mouseViewMode: 'drag',
      showControls: true,
    });

    await db.execute(
      `INSERT INTO Tour (
        id, title, description, status, shareToken, settings,
        organizationId, createdById, createdAt, updatedAt, isPublic,
        viewCount, backgroundAudioVolume, showSceneMenu, showHotspotTitles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?)`,
      [
        tourId,
        title,
        description || null,
        'DRAFT',
        shareToken,
        settingsJson,
        authPayload.organizationId,
        authPayload.userId,
        false,
        0,
        0.5,
        true,
        true,
      ]
    );

    // Fetch created tour with creator info
    const tour: any = await db.queryOne(
      `SELECT
        t.*,
        u.firstName as createdBy_firstName,
        u.lastName as createdBy_lastName
       FROM Tour t
       JOIN User u ON t.createdById = u.id
       WHERE t.id = ?`,
      [tourId]
    );

    // Transform to match Prisma structure
    const tourResponse = {
      id: tour.id,
      title: tour.title,
      description: tour.description,
      coverImageUrl: tour.coverImageUrl,
      status: tour.status,
      shareToken: tour.shareToken,
      isPublic: tour.isPublic,
      viewCount: tour.viewCount,
      settings: typeof tour.settings === 'string' ? JSON.parse(tour.settings) : tour.settings,
      organizationId: tour.organizationId,
      createdById: tour.createdById,
      createdAt: tour.createdAt,
      updatedAt: tour.updatedAt,
      customLogoUrl: tour.customLogoUrl,
      backgroundAudioUrl: tour.backgroundAudioUrl,
      backgroundAudioVolume: tour.backgroundAudioVolume,
      showSceneMenu: tour.showSceneMenu,
      showHotspotTitles: tour.showHotspotTitles,
      createdBy: {
        firstName: tour.createdBy_firstName,
        lastName: tour.createdBy_lastName,
      },
      images: [],
    };

    return NextResponse.json(
      {
        success: true,
        data: tourResponse,
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
