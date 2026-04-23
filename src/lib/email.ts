import nodemailer from 'nodemailer';

/**
 * Get email transporter using standard SMTP
 * Environment variables:
 * - EMAIL_SMTP_HOST
 * - EMAIL_SMTP_PORT
 * - EMAIL_SMTP_SECURE (true/false)
 * - EMAIL_SMTP_USER
 * - EMAIL_SMTP_PASS
 */
export function getEmailTransporter(): nodemailer.Transporter {
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
    const sender = getSenderEmail();

    const result = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
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
  | 'inscription-pending'
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
      return getWelcomeTemplate(data as { firstName: string; appUrl: string });
    case 'invitation':
      return getInvitationTemplate(
        data as {
          senderName: string;
          organizationName: string;
          inviteLink: string;
          appUrl: string;
        }
      );
    case 'inscription-pending':
      return getInscriptionPendingTemplate(
        data as { firstName: string; planType: string; appUrl: string }
      );
    case 'inscription-approved':
      return getInscriptionApprovedTemplate(
        data as { firstName: string; planName: string; appUrl: string }
      );
    case 'inscription-rejected':
      return getInscriptionRejectedTemplate(
        data as { firstName: string; reason?: string; supportEmail: string }
      );
    case 'password-reset':
      return getPasswordResetTemplate(data as { resetLink: string });
    case 'admin-notification':
      return getAdminNotificationTemplate(
        data as { title: string; message: string; actionUrl?: string; actionText?: string }
      );
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

function getInscriptionPendingTemplate(data: {
  firstName: string;
  planType: string; // FREE or PROFESSIONAL
  appUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Thank you for your Panoramate registration request',
    html: `
      <h2>Thank you for your request, ${data.firstName}!</h2>
      <p>We've received your registration request for the <strong>${data.planType === 'PROFESSIONAL' ? 'Professional' : 'Free Trial'}</strong> plan.</p>

      <h3>What happens next?</h3>
      <p>Our team will review your request to ensure we're a good fit for your needs. This typically takes 1-2 business days.</p>

      <p>Once approved, you'll receive an email with your account credentials and can start creating beautiful 360° virtual tours.</p>

      <p><strong> Keep this email:</strong> We'll send you updates about your request status at this email address.</p>

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
