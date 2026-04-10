import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface InscriptionRequestData {
  type: 'FREE' | 'PROFESSIONAL';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  numberOfTours?: number;
  imagesPerTour?: number;
  teamMembers?: number;
  frequency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: InscriptionRequestData = await request.json();
    const email = data.email?.trim().toLowerCase();
    const prismaInscriptionRequest = (db as any).inscriptionRequest;

    if (
      !prismaInscriptionRequest ||
      typeof prismaInscriptionRequest.findUnique !== 'function' ||
      typeof prismaInscriptionRequest.create !== 'function'
    ) {
      logger.error({
        event: 'inscription_request_delegate_missing',
        hasDb: Boolean(db),
        hasInscriptionRequest: Boolean(prismaInscriptionRequest),
      });

      return NextResponse.json(
        { error: 'Database client is not ready. Please restart the server and try again.' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!data.type || !data.firstName || !data.lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingRequest = await prismaInscriptionRequest.findUnique({
      where: { email },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Email already submitted' },
        { status: 400 }
      );
    }

    // Create inscription request
    const inscriptionRequest = await prismaInscriptionRequest.create({
      data: {
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        email,
        phone: data.phone,
        company: data.company,
        country: data.country,
        numberOfTours: data.numberOfTours ? parseInt(String(data.numberOfTours)) : null,
        imagesPerTour: data.imagesPerTour ? parseInt(String(data.imagesPerTour)) : null,
        teamMembers: data.teamMembers ? parseInt(String(data.teamMembers)) : null,
        frequency: data.frequency,
        status: 'PENDING',
      },
    });

    // Log the inscription request
    console.info({
      event: 'new_inscription_request',
      type: data.type,
      data: data,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription request submitted successfully',
        data: {
          id: inscriptionRequest.id,
          email: inscriptionRequest.email,
          status: inscriptionRequest.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
     console.error('Error processing inscription request:', error);

    return NextResponse.json(
      { error: 'Failed to process inscription request' },
      { status: 500 }
    );
  }
}
