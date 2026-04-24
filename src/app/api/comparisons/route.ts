import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const authPayload = await getAuthUser(request);
        if (!authPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title } = body;

        const id = uuidv4();
        const userId = authPayload.userId || authPayload.id;
        const comparisonTitle = title || 'Comparison ' + new Date().toLocaleDateString();
        const now = new Date();

        await db.execute(
            `INSERT INTO comparisons (id, title, organizationId, createdById, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, comparisonTitle, authPayload.organizationId, userId, now, now]
        );

        const comparison = await db.queryOne(
            'SELECT * FROM comparisons WHERE id = ?',
            [id]
        );

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

        const comparisons: any = await db.query(
            `SELECT c.*,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', ci.id,
                            'comparisonId', ci.comparisonId,
                            'filename', ci.filename,
                            'originalName', ci.originalName,
                            'mimeType', ci.mimeType,
                            'sizeMb', ci.sizeMb,
                            'width', ci.width,
                            'height', ci.height,
                            'captureDate', ci.captureDate,
                            'createdAt', ci.createdAt
                        )
                    ) as images
             FROM comparisons c
             LEFT JOIN comparison_images ci ON c.id = ci.comparisonId
             WHERE c.organizationId = ?
             GROUP BY c.id
             ORDER BY c.createdAt DESC`,
            [authPayload.organizationId]
        );

        // Parse the JSON_ARRAYAGG results
        const comparisonsData = comparisons.map((c: any) => ({
            ...c,
            images: c.images ? JSON.parse(c.images).filter((img: any) => img.id !== null) : []
        }));

        return NextResponse.json({ success: true, data: comparisonsData });
    } catch (error) {
        console.error('Get comparisons error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
