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

        const comparison = await db.comparison.findUnique({
            where: { id: params.id },
            include: {
                images: {
                    orderBy: { captureDate: 'asc' },
                },
            },
        });

        if (!comparison) {
            return NextResponse.json(
                { error: 'Comparison not found' },
                { status: 404 }
            );
        }

        // CHECK: authPayload.organizationId === comparison.organizationId

        return NextResponse.json({ success: true, data: comparison });
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

        const comparison = await db.comparison.findUnique({
            where: { id: params.id },
            include: { images: true },
        });

        if (!comparison) {
            return NextResponse.json(
                { error: 'Comparison not found' },
                { status: 404 }
            );
        }

        // Delete files
        for (const image of comparison.images) {
            await deleteFile(image.filename);

            // Update organization storage
            await db.organization.update({
                where: { id: comparison.organizationId },
                data: {
                    usedStorageMb: {
                        decrement: image.sizeMb,
                    },
                },
            });
        }

        await db.comparison.delete({
            where: { id: params.id },
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
