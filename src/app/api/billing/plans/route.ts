import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const plans = await db.plan.findMany({
      where: { isActive: true },
      orderBy: { maxTours: 'asc' },
    });

    if (plans.length === 0) {
      // Return hardcoded plans if no seed data
      return NextResponse.json(
        {
          success: true,
          data: [
            {
              id: 'starter',
              name: 'Starter',
              planType: 'STARTER',
              priceMonthly: 29,
              priceYearly: 290,
              maxTours: 5,
              maxImagesPerTour: 50,
              maxStorageMb: 2048,
              features: [
                '5 Virtual Tours',
                '50 Scenes per Tour',
                '2 GB Storage',
                'Advanced Editor',
                'Public Sharing',
                'Team Members (2)',
                'Email Support',
              ],
            },
            {
              id: 'professional',
              name: 'Professional',
              planType: 'PROFESSIONAL',
              priceMonthly: 79,
              priceYearly: 790,
              maxTours: 20,
              maxImagesPerTour: 200,
              maxStorageMb: 10240,
              features: [
                '20 Virtual Tours',
                '200 Scenes per Tour',
                '10 GB Storage',
                'Advanced Editor',
                'Public Sharing',
                'Team Members (10)',
                'Priority Support',
                'Analytics & Reporting',
                'Custom Branding',
              ],
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              planType: 'ENTERPRISE',
              priceMonthly: 199,
              priceYearly: 1990,
              maxTours: -1,
              maxImagesPerTour: -1,
              maxStorageMb: 102400,
              features: [
                'Unlimited Tours',
                'Unlimited Scenes',
                '100 GB Storage',
                'Advanced Editor',
                'Public Sharing',
                'Unlimited Team Members',
                '24/7 Phone Support',
                'Advanced Analytics',
                'White Label',
                'API Access',
                'Custom Integrations',
              ],
            },
          ],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: plans,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
