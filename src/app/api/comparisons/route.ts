import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const authPayload = await getAuthUser(request);
        if (!authPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title } = body;

        const comparison = await db.comparison.create({
            data: {
                title: title || 'Comparison ' + new Date().toLocaleDateString(),
                organizationId: authPayload.organizationId,
                createdById: authPayload.userId || authPayload.id, // Depending on payload structure
            },
        });

        return NextResponse.json(
            { success: true, data: comparison },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create comparison error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const authPayload = await getAuthUser(request);
        if (!authPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const comparisons = await db.comparison.findMany({
            where: { organizationId: authPayload.organizationId },
            include: {
                images: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, data: comparisons });
    } catch (error) {
        console.error('Get comparisons error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
