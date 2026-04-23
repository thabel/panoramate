import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authPayload = await getAuthUser(request);
        if (!authPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const comparison = await db.queryOne(
            'SELECT * FROM comparisons WHERE id = ?',
            [params.id]
        );

        if (!comparison) {
            return NextResponse.json(
                { error: 'Comparison not found' },
                { status: 404 }
            );
        }

        // CHECK: authPayload.organizationId === comparison.organizationId

        const images: any = await db.query(
            'SELECT * FROM comparison_images WHERE comparisonId = ? ORDER BY captureDate ASC',
            [params.id]
        );

        const comparisonData = {
            ...comparison,
            images: images || []
        };

        return NextResponse.json({ success: true, data: comparisonData });
    } catch (error) {
        console.error('Get comparison error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authPayload = await getAuthUser(request);
        if (!authPayload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const comparison = await db.queryOne(
            'SELECT * FROM comparisons WHERE id = ?',
            [params.id]
        );

        if (!comparison) {
            return NextResponse.json(
                { error: 'Comparison not found' },
                { status: 404 }
            );
        }

        const images: any = await db.query(
            'SELECT * FROM comparison_images WHERE comparisonId = ?',
            [params.id]
        );

        // Delete files and update storage in a transaction
        await db.transaction(async (connection) => {
            for (const image of images) {
                await deleteFile(image.filename);

                // Update organization storage
                await connection.execute(
                    'UPDATE organizations SET usedStorageMb = usedStorageMb - ? WHERE id = ?',
                    [image.sizeMb, comparison.organizationId]
                );
            }

            // Delete comparison (CASCADE will delete images)
            await connection.execute(
                'DELETE FROM comparisons WHERE id = ?',
                [params.id]
            );
        });

        return NextResponse.json({ success: true, message: 'Comparison deleted' });
    } catch (error) {
        console.error('Delete comparison error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
