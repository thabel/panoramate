import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authPayload = await getAuthUser(request);
    if (!authPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const offset = (page - 1) * limit;

    const [invoices, totalResult]: any = await Promise.all([
      db.query(
        'SELECT * FROM Invoice WHERE organizationId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?',
        [authPayload.organizationId, limit, offset]
      ),
      db.queryOne(
        'SELECT COUNT(*) as total FROM Invoice WHERE organizationId = ?',
        [authPayload.organizationId]
      ),
    ]);

    const total = totalResult?.total || 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          invoices,
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
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
