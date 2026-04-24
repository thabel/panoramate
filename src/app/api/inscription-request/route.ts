import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

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
    const existingRequest = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE email = ?',
      [email]
    );

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Email already submitted' },
        { status: 400 }
      );
    }

    // Create inscription request
    const inscriptionId = uuidv4();
    const now = new Date();

    await db.execute(
      `INSERT INTO inscription_requests (id, type, firstName, lastName, email, phone, company, country, numberOfTours, imagesPerTour, teamMembers, frequency, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inscriptionId,
        data.type,
        data.firstName,
        data.lastName,
        email,
        data.phone || null,
        data.company || null,
        data.country || null,
        data.numberOfTours ? parseInt(String(data.numberOfTours)) : null,
        data.imagesPerTour ? parseInt(String(data.imagesPerTour)) : null,
        data.teamMembers ? parseInt(String(data.teamMembers)) : null,
        data.frequency || null,
        'PENDING',
        now,
        now
      ]
    );

    const inscriptionRequest = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE id = ?',
      [inscriptionId]
    );

    // Log the inscription request
    console.info({
      event: 'new_inscription_request',
      type: data.type,
      data: data,
    });

    // Send pending confirmation email to the user
    // Note: This may fail if the email is fake/invalid, but we don't want to block the request
    const confirmationTemplate = getEmailTemplate('inscription-pending', {
      firstName: data.firstName,
      planType: data.type,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.panoramate.com',
    });

    const emailResult = await sendEmail(
      email,
      confirmationTemplate.subject,
      confirmationTemplate.html
    );

    if (!emailResult.success) {
      logger.warn({
        event: 'inscription_confirmation_email_failed',
        email,
        inscriptionId: inscriptionRequest.id,
        error: emailResult.error,
      });
      // Don't fail the request - user still submitted even if email failed
    } else {
      logger.info({
        event: 'inscription_confirmation_email_sent',
        email,
        inscriptionId: inscriptionRequest.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription request submitted successfully. Please check your email.',
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
