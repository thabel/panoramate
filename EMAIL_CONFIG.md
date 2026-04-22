# Email Configuration Guide

Panoramate supports multiple email providers. Choose one and configure the required environment variables.

## Supported Providers

1. **SMTP** (Gmail, Postmark, SendinBlue, Custom SMTP)
2. **SendGrid**
3. **Mailgun**

---

## 1. SMTP Configuration (Recommended for simple setup)

### Environment Variables

```bash
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com          # SMTP server hostname
EMAIL_SMTP_PORT=587                      # SMTP port (usually 587 for TLS, 465 for SSL)
EMAIL_SMTP_SECURE=true                   # Use TLS/SSL (true/false)
EMAIL_SMTP_USER=your-email@gmail.com     # SMTP username
EMAIL_SMTP_PASS=your-app-password        # SMTP password
EMAIL_FROM_NAME=Panoramate               # Sender name displayed in emails
EMAIL_FROM_ADDRESS=noreply@panoramate.com # Sender email address
```

### Gmail Setup Example

1. Enable 2-Factor Authentication
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Use the generated password in `EMAIL_SMTP_PASS`

```bash
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-gmail@gmail.com
EMAIL_SMTP_PASS=your-16-char-app-password
```

### Postmark Setup Example

```bash
EMAIL_SMTP_HOST=smtp.postmarkapp.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-postmark-api-token
EMAIL_SMTP_PASS=your-postmark-api-token
```

---

## 2. SendGrid Configuration

### Prerequisites

- SendGrid account with API key: https://sendgrid.com/

### Environment Variables

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_NAME=Panoramate
EMAIL_FROM_ADDRESS=noreply@panoramate.com
```

### Installation

```bash
npm install nodemailer-sendgrid-transport
```

---

## 3. Mailgun Configuration

### Prerequisites

- Mailgun account: https://www.mailgun.com/
- Domain verified and active

### Environment Variables

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxxxxxxxxxxxxxxxxxxx
MAILGUN_DOMAIN=mail.yourdomain.com      # Your Mailgun domain
EMAIL_FROM_NAME=Panoramate
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

### Installation

```bash
npm install nodemailer-mailgun-transport
```

---

## Email Templates

The system includes pre-built templates for:

1. **welcome** - Sent when user registers
2. **invitation** - Sent when invited to a team
3. **inscription-approved** - When registration is approved
4. **inscription-rejected** - When registration is rejected
5. **password-reset** - Password reset link
6. **admin-notification** - Internal admin notifications

### Using Email Templates

```typescript
import { sendEmail, getEmailTemplate } from '@/lib/email';

// Get template
const template = getEmailTemplate('welcome', {
  firstName: 'John',
  appUrl: 'https://app.panoramate.com',
});

// Send email
await sendEmail(
  'user@example.com',
  template.subject,
  template.html,
  template.text
);
```

---

## Testing Email Configuration

Add this test endpoint to verify your email setup:

```typescript
// src/app/api/email/test/route.ts
import { sendEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const result = await sendEmail(
    email,
    'Test Email from Panoramate',
    '<h1>Hello!</h1><p>This is a test email.</p>'
  );

  return NextResponse.json(result);
}
```

Test with curl:
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Current Email Usage in Code

The system will automatically send emails for:

- **New User Registration** - Welcome email
- **Team Invitation** - Invitation email with accept link
- **Inscription Approval** - Confirmation email
- **Inscription Rejection** - Status update email
- **Admin Actions** - Internal notifications

---

## Troubleshooting

### "Email service not configured"

- Verify `EMAIL_PROVIDER` is set
- Check all required environment variables for your provider
- Restart the application after changing env vars

### "Failed to send email"

- Check SMTP credentials are correct
- Verify firewall/VPN allows SMTP connections
- Check provider's rate limits
- Enable "Less secure app access" (Gmail only)
- Check API quota/usage limits (SendGrid/Mailgun)

### Gmail not working

- Must use App Password, not regular password
- Enable 2-Factor Authentication first
- Create app password: https://myaccount.google.com/apppasswords

---

## Next Steps

1. Choose your email provider
2. Set environment variables in `.env.local`
3. Install any required packages (SendGrid/Mailgun)
4. Test configuration using the test endpoint
5. Emails will start sending automatically

## Environment Variables Template

Add to `.env.local`:

```
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
EMAIL_FROM_NAME=Panoramate
EMAIL_FROM_ADDRESS=noreply@panoramate.com
APP_URL=http://localhost:3000
```
