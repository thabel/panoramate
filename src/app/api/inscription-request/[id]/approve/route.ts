import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';
import { hashPassword, generateSlug } from '@/lib/auth';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';

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
    let token: string | null = null;

    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try cookie
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        for (const cookie of cookies) {
          if (cookie.startsWith('token=')) {
            token = cookie.substring(6);
            break;
          }
        }
      }
    }

    if (!token) {
      console.log('[APPROVE] No token found in Authorization header or cookie');
      return null;
    }

    const verified = await jwtVerify(token, JWT_SECRET);
    const userId = verified.payload.userId as string;

    // Get user and check if SUPER_ADMIN (only SUPER_ADMIN can approve inscriptions)
    const user = await db.queryOne(
      `SELECT u.*, o.id as org_id, o.name as org_name, o.slug as org_slug, o.plan as org_plan
       FROM users u
       LEFT JOIN organizations o ON u.organizationId = o.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      console.log('[APPROVE] User not found:', userId);
      return null;
    }

    if (user.role !== 'SUPER_ADMIN') {
      console.log('[APPROVE] User is not SUPER_ADMIN:', user.role);
      return null;
    }

    console.log('[APPROVE] SUPER_ADMIN verified:', user.id);

    // Transform to match Prisma structure
    const userWithOrg = {
      ...user,
      organization: user.org_id ? {
        id: user.org_id,
        name: user.org_name,
        slug: user.org_slug,
        plan: user.org_plan
      } : null
    };

    return userWithOrg;
  } catch (error) {
    console.error('[APPROVE] Auth verification error:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[APPROVE] Request received for inscription:', params.id);

    // Verify SUPER_ADMIN auth (only SUPER_ADMIN can approve inscriptions)
    const superAdmin = await verifySuperAdminAuth(request);
    if (!superAdmin) {
      console.warn('[APPROVE] Unauthorized - no valid SUPER_ADMIN token');
      return NextResponse.json(
        { error: 'Unauthorized - SUPER_ADMIN access required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get the inscription request
    const inscriptionRequest = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE id = ?',
      [id]
    );

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
    const existingUser = await db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [inscriptionRequest.email]
    );

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

    const organizationId = uuidv4();
    const userId = uuidv4();
    const now = new Date();
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const plan = inscriptionRequest.type === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'FREE_TRIAL';
    const subscriptionStatus = inscriptionRequest.type === 'PROFESSIONAL' ? 'ACTIVE' : 'TRIALING';
    const maxTours = inscriptionRequest.type === 'PROFESSIONAL' ? 20 : 1;
    const maxImagesPerTour = inscriptionRequest.type === 'PROFESSIONAL' ? 200 : 10;
    const totalStorageMb = inscriptionRequest.type === 'PROFESSIONAL' ? 10240 : 500;

    // Create organization, user, and update inscription in a transaction
    await db.transaction(async (connection) => {
      // Create organization
      await connection.execute(
        `INSERT INTO organizations (id, name, slug, plan, subscriptionStatus, trialEndsAt, maxTours, maxImagesPerTour, totalStorageMb, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [organizationId, organizationName, slug, plan, subscriptionStatus, trialEndsAt, maxTours, maxImagesPerTour, totalStorageMb, now, now]
      );

      // Create user account (ADMIN role for organization)
      await connection.execute(
        `INSERT INTO users (id, email, password, firstName, lastName, role, organizationId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, inscriptionRequest.email, hashedPassword, inscriptionRequest.firstName, inscriptionRequest.lastName, 'ADMIN', organizationId, now, now]
      );

      // Update inscription request status to APPROVED
      await connection.execute(
        'UPDATE inscription_requests SET status = ?, approvedAt = ?, updatedAt = ? WHERE id = ?',
        ['APPROVED', now, now, id]
      );
    });

    // Fetch the created records
    const organization = await db.queryOne(
      'SELECT * FROM organizations WHERE id = ?',
      [organizationId]
    );

    const user = await db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const updated = await db.queryOne(
      'SELECT * FROM inscription_requests WHERE id = ?',
      [id]
    );

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
