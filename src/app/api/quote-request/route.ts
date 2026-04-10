import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface QuoteRequestData {
  company: string;
  fullName: string;
  country: string;
  email: string;
  phone: string;
  tours: string;
  imagesPerTour: string;
  teamMembers: string;
  frequency: 'monthly' | 'annual';
}

export async function POST(request: NextRequest) {
  try {
    const data: QuoteRequestData = await request.json();

    // Validate required fields
    if (
      !data.company ||
      !data.fullName ||
      !data.country ||
      !data.email ||
      !data.phone ||
      !data.tours ||
      !data.imagesPerTour ||
      !data.teamMembers ||
      !data.frequency
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the quote request
    logger.info({
      event: 'quote_request_received',
      company: data.company,
      email: data.email,
      phone: data.phone,
      tours: data.tours,
      imagesPerTour: data.imagesPerTour,
      teamMembers: data.teamMembers,
      frequency: data.frequency,
    });

    // TODO: In production, integrate with:
    // 1. Email service (SendGrid, Mailgun, etc.) to notify sales team
    // 2. CRM system (HubSpot, Salesforce, etc.) to track leads
    // 3. Database to store quote requests

    // For now, we'll just log and return success
    // This is a placeholder for future integrations

    return NextResponse.json(
      {
        success: true,
        message: 'Quote request received successfully',
        data: {
          company: data.company,
          email: data.email,
          receivedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'quote_request_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
