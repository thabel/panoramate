import nodemailer from 'nodemailer';

/**
 * Email Configuration
 * Supports multiple email providers via environment variables
 */

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

/**
 * Get email transporter based on configuration
 */
export function getEmailTransporter(): nodemailer.Transporter | null {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  if (provider === 'smtp') {
    return createSMTPTransporter();
  } else if (provider === 'sendgrid') {
    return createSendGridTransporter();
  } else if (provider === 'mailgun') {
    return createMailgunTransporter();
  }

  console.warn('Email provider not configured or unknown provider');
  return null;
}

/**
 * Create SMTP transporter (Gmail, Postmark, Custom SMTP, etc.)
 * Environment variables:
 * - EMAIL_PROVIDER=smtp
 * - EMAIL_SMTP_HOST
 * - EMAIL_SMTP_PORT
 * - EMAIL_SMTP_SECURE (true/false)
 * - EMAIL_SMTP_USER
 * - EMAIL_SMTP_PASS
 * - EMAIL_FROM_NAME
 * - EMAIL_FROM_ADDRESS
 */
function createSMTPTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST || 'localhost',
    port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
    secure: process.env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER || '',
      pass: process.env.EMAIL_SMTP_PASS || '',
    },
  });
}

/**
 * Create SendGrid transporter
 * Environment variables:
 * - EMAIL_PROVIDER=sendgrid
 * - SENDGRID_API_KEY
 * - EMAIL_FROM_NAME
 * - EMAIL_FROM_ADDRESS
 */
function createSendGridTransporter(): nodemailer.Transporter {
  const sgTransport = require('nodemailer-sendgrid-transport');

  return nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key: process.env.SENDGRID_API_KEY || '',
      },
    })
  );
}

/**
 * Create Mailgun transporter
 * Environment variables:
 * - EMAIL_PROVIDER=mailgun
 * - MAILGUN_API_KEY
 * - MAILGUN_DOMAIN
 * - EMAIL_FROM_NAME
 * - EMAIL_FROM_ADDRESS
 */
function createMailgunTransporter(): nodemailer.Transporter {
  const mgTransport = require('nodemailer-mailgun-transport');

  return nodemailer.createTransport(
    mgTransport({
      auth: {
        api_key: process.env.MAILGUN_API_KEY || '',
        domain: process.env.MAILGUN_DOMAIN || '',
      },
    })
  );
}

/**
 * Get sender email address
 */
export function getSenderEmail(): { name: string; email: string } {
  return {
    name: process.env.EMAIL_FROM_NAME || 'Panoramate',
    email: process.env.EMAIL_FROM_ADDRESS || 'noreply@panoramate.com',
  };
}

/**
 * Send email utility function
 */
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      console.warn('Email transporter not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const sender = getSenderEmail();

    const result = await transporter.sendMail({
      from: `${sender.name} <${sender.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text
    });

    console.log('Email sent successfully:', result.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Email template types
 */
export type EmailTemplate =
  | 'welcome'
  | 'invitation'
  | 'inscription-approved'
  | 'inscription-rejected'
  | 'password-reset'
  | 'admin-notification';

/**
 * Get email template by type
 */
export function getEmailTemplate(
  type: EmailTemplate,
  data: Record<string, any>
): { subject: string; html: string; text?: string } {
  switch (type) {
    case 'welcome':
      return getWelcomeTemplate(data);
    case 'invitation':
      return getInvitationTemplate(data);
    case 'inscription-approved':
      return getInscriptionApprovedTemplate(data);
    case 'inscription-rejected':
      return getInscriptionRejectedTemplate(data);
    case 'password-reset':
      return getPasswordResetTemplate(data);
    case 'admin-notification':
      return getAdminNotificationTemplate(data);
    default:
      return {
        subject: 'Panoramate Notification',
        html: '<p>Hello</p>',
      };
  }
}

// Email Templates

function getWelcomeTemplate(data: {
  firstName: string;
  appUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Welcome to Panoramate! 🎉',
    html: `
      <h2>Welcome to Panoramate, ${data.firstName}!</h2>
      <p>We're excited to have you on board. You can now create and share immersive 360° virtual tours.</p>
      <p>
        <a href="${data.appUrl}/dashboard" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </p>
      <p>If you have any questions, feel free to contact our support team.</p>
    `,
  };
}

function getInvitationTemplate(data: {
  senderName: string;
  organizationName: string;
  inviteLink: string;
  appUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${data.organizationName} on Panoramate`,
    html: `
      <h2>You're invited to collaborate!</h2>
      <p>${data.senderName} has invited you to join <strong>${data.organizationName}</strong> on Panoramate.</p>
      <p>
        <a href="${data.inviteLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Accept Invitation
        </a>
      </p>
      <p>This invitation will expire in 7 days.</p>
    `,
  };
}

function getInscriptionApprovedTemplate(data: {
  firstName: string;
  planName: string;
  appUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Your Panoramate registration has been approved! ✅',
    html: `
      <h2>Great news, ${data.firstName}!</h2>
      <p>Your registration for the <strong>${data.planName}</strong> plan has been approved.</p>
      <p>Your account is now active and ready to use.</p>
      <p>
        <a href="${data.appUrl}/login" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Sign In Now
        </a>
      </p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `,
  };
}

function getInscriptionRejectedTemplate(data: {
  firstName: string;
  reason?: string;
  supportEmail: string;
}): { subject: string; html: string } {
  return {
    subject: 'About your Panoramate registration',
    html: `
      <h2>Registration Status Update</h2>
      <p>Hi ${data.firstName},</p>
      <p>Thank you for your interest in Panoramate. Unfortunately, your registration has been declined.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      <p>If you believe this is a mistake, please contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
    `,
  };
}

function getPasswordResetTemplate(data: {
  resetLink: string;
}): { subject: string; html: string } {
  return {
    subject: 'Reset Your Panoramate Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${data.resetLink}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  };
}

function getAdminNotificationTemplate(data: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): { subject: string; html: string } {
  return {
    subject: `[Admin] ${data.title}`,
    html: `
      <h2>${data.title}</h2>
      <p>${data.message}</p>
      ${
        data.actionUrl && data.actionText
          ? `
        <p>
          <a href="${data.actionUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            ${data.actionText}
          </a>
        </p>
      `
          : ''
      }
    `,
  };
}
