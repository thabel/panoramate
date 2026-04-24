import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { saveUploadedFile } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const captureDateStr = formData.get('captureDate') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!captureDateStr) {
            return NextResponse.json(
                { error: 'captureDate is required' },
                { status: 400 }
            );
        }

        const captureDate = new Date(captureDateStr);
        if (isNaN(captureDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid captureDate' },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        const orgId = authPayload.organizationId;

        // Using a virtual folder "comparisons" or the ID
        const { filename, width, height, sizeMb } = await saveUploadedFile(
            Buffer.from(uint8Array),
            orgId,
            `comparisons/${comparison.id}`,
            file.name
        );

        const imageId = uuidv4();
        const now = new Date();

        await db.execute(
            `INSERT INTO comparison_images (id, comparisonId, filename, originalName, mimeType, sizeMb, width, height, captureDate, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [imageId, comparison.id, filename, file.name, file.type, sizeMb, width, height, captureDate, now]
        );

        const image = await db.queryOne(
            'SELECT * FROM comparison_images WHERE id = ?',
            [imageId]
        );

        // Update organization storage
        await db.execute(
            'UPDATE organizations SET usedStorageMb = usedStorageMb + ? WHERE id = ?',
            [sizeMb, orgId]
        );

        return NextResponse.json(
            { success: true, data: image },
            { status: 201 }
        );
    } catch (error) {
        console.error('Upload comparison image error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
