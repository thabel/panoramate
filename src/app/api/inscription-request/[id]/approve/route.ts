import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';
import { hashPassword, generateSlug } from '@/lib/auth';
import { sendEmail, getEmailTemplate } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * Generate a temporary password
 * Format: Uppercase(2) + Lowercase(4) + Digits(4) + Special(2)
 * Example: Abc1234567!@
 */
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  const getRandomChar = (str: string) => str[Math.floor(Math.random() * str.length)];

  let password = '';
  password += getRandomChar(uppercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(special);
  password += getRandomChar(special);

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

async function verifySuperAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = verified.payload.userId as string;

    // Get user and check if SUPER_ADMIN (only SUPER_ADMIN can approve inscriptions)
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify SUPER_ADMIN auth (only SUPER_ADMIN can approve inscriptions)
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the inscription request
    const inscriptionRequest = await db.inscriptionRequest.findUnique({
      where: { id },
    });

    if (!inscriptionRequest) {
      return NextResponse.json(
        { error: 'Inscription request not found' },
        { status: 404 }
      );
    }

    if (inscriptionRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only PENDING requests can be approved' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: inscriptionRequest.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Create organization for this user
    const organizationName = `${inscriptionRequest.firstName} ${inscriptionRequest.lastName}'s Organization`;
    const slug = generateSlug(organizationName);

    const organization = await db.organization.create({
      data: {
        name: organizationName,
        slug,
        plan: inscriptionRequest.type === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'FREE_TRIAL',
        subscriptionStatus: inscriptionRequest.type === 'PROFESSIONAL' ? 'ACTIVE' : 'TRIALING',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        maxTours: inscriptionRequest.type === 'PROFESSIONAL' ? 20 : 1,
        maxImagesPerTour: inscriptionRequest.type === 'PROFESSIONAL' ? 200 : 10,
        totalStorageMb: inscriptionRequest.type === 'PROFESSIONAL' ? 10240 : 500,
      },
    });

    // Create user account (ADMIN role for organization)
    const user = await db.user.create({
      data: {
        email: inscriptionRequest.email,
        password: hashedPassword,
        firstName: inscriptionRequest.firstName,
        lastName: inscriptionRequest.lastName,
        role: 'ADMIN', // First user of org is ADMIN
        organizationId: organization.id,
      },
    });

    // Update inscription request status to APPROVED
    const updated = await db.inscriptionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // Send approval email with temporary password
    const approvalTemplate = getEmailTemplate('inscription-approved', {
      firstName: inscriptionRequest.firstName,
      planName: inscriptionRequest.type === 'PROFESSIONAL' ? 'Professional' : 'Free Trial',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.panoramate.com',
    });

    // Create custom email with temporary password
    const emailWithPassword = approvalTemplate.html.replace(
      '</p>',
      `</p>
      <h3>Your Temporary Password</h3>
      <p><strong>${temporaryPassword}</strong></p>
      <p><strong>⚠️ Important:</strong> Please change this password immediately after your first login for security.</p>
      <p></p>`
    );

    const emailResult = await sendEmail(
      inscriptionRequest.email,
      'Welcome to Panoramate! Your Account is Ready',
      emailWithPassword
    );

    if (!emailResult.success) {
      logger.error({
        event: 'inscription_approval_email_failed',
        email: inscriptionRequest.email,
        userId: user.id,
        error: emailResult.error,
      });
      // Note: User account was created successfully, but email failed
    } else {
      logger.info({
        event: 'inscription_approval_email_sent',
        email: inscriptionRequest.email,
        userId: user.id,
      });
    }

    logger.info({
      event: 'inscription_request_approved_with_account_created',
      id,
      email: updated.email,
      userId: user.id,
      organizationId: organization.id,
      approvedBy: superAdmin.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Inscription request approved and user account created',
        data: {
          inscription: updated,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          organization: {
            id: organization.id,
            name: organization.name,
            plan: organization.plan,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      event: 'inscription_approval_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to approve inscription request' },
      { status: 500 }
    );
  }
}
