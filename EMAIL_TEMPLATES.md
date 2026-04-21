# Email Templates Documentation

## Overview

All email templates are defined in `src/lib/email.ts`. This document shows the exact text and structure of each template for easy review and modification.

---

## 1. WELCOME EMAIL

### 📌 TLDR
Sent to users after they create an account (direct registration or after inscription approval).

### ✉️ When Sent
- After direct user registration: `POST /api/auth/register`
- After inscription approval: `POST /api/inscription-request/[id]/approve`

### 📋 Required Variables
- `firstName`: User's first name
- `appUrl`: Application URL (e.g., https://app.panoramate.com)

### 📧 Subject Line
```
Welcome to Panoramate! 🎉
```

### 📝 Email Content

```
Welcome to Panoramate, [firstName]!

We're excited to have you on board. You can now create and share
immersive 360° virtual tours.

[BUTTON: Go to Dashboard] → {appUrl}/dashboard

If you have any questions, feel free to contact our support team.
```

### 💾 Template Code
```typescript
getEmailTemplate('welcome', {
  firstName: 'John',
  appUrl: 'https://app.panoramate.com',
})
```

---

## 2. TEAM INVITATION EMAIL

### 📌 TLDR
Sent when an ADMIN or MEMBER invites someone to join their organization team.

### ✉️ When Sent
- When invitation created: `POST /api/team/route.ts`

### 📋 Required Variables
- `senderName`: Name of person inviting (e.g., "John Doe")
- `organizationName`: Name of organization (e.g., "Acme Corp")
- `inviteLink`: Full URL to accept invitation (token-based)
- `appUrl`: Application URL

### 📧 Subject Line
```
You've been invited to [organizationName] on Panoramate
```

### 📝 Email Content

```
You're invited to collaborate!

[senderName] has invited you to join [organizationName] on Panoramate.

[BUTTON: Accept Invitation] → {inviteLink}

This invitation will expire in 7 days.
```

### 💾 Template Code
```typescript
getEmailTemplate('invitation', {
  senderName: 'John Doe',
  organizationName: 'Acme Corp',
  inviteLink: 'https://app.panoramate.com/invite?token=abc123',
  appUrl: 'https://app.panoramate.com',
})
```

---

## 3. INSCRIPTION REQUEST CONFIRMATION EMAIL

### 📌 TLDR
Sent immediately after user submits an inscription request form (FREE or PROFESSIONAL plan).

### ✉️ When Sent
- After request submission: `POST /api/inscription-request/route.ts`
- **Note:** Uses the WELCOME template with a custom subject

### 📋 Required Variables
- `firstName`: User's first name
- `appUrl`: Application URL

### 📧 Subject Line
```
Thank you for your Panoramate registration request
```

### 📝 Email Content

```
Welcome to Panoramate, [firstName]!

We're excited to have you on board. You can now create and share
immersive 360° virtual tours.

[BUTTON: Go to Dashboard] → {appUrl}/dashboard

If you have any questions, feel free to contact our support team.
```

### 📌 Important Notes
- ⚠️ This email may FAIL if user provided a fake/invalid email
- ✅ Email failure is NON-BLOCKING (request still succeeds)
- 📝 Check server logs for email failures

### 💾 How It's Sent
```typescript
const confirmationTemplate = getEmailTemplate('welcome', {
  firstName: data.firstName,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '...',
});

await sendEmail(
  email,
  'Thank you for your Panoramate registration request',
  confirmationTemplate.html
);
```

---

## 4. INSCRIPTION APPROVAL EMAIL (WITH TEMPORARY PASSWORD)

### 📌 TLDR
Sent by SUPER_ADMIN when approving an inscription request. Includes temporary password for immediate login.

### ✉️ When Sent
- When SUPER_ADMIN approves: `POST /api/inscription-request/[id]/approve/route.ts`

### 📋 Required Variables
- `firstName`: User's first name
- `planName`: Plan name (e.g., "Professional" or "Free Trial")
- `appUrl`: Application URL
- `temporaryPassword`: Auto-generated 12-char password

### 📧 Subject Line
```
Welcome to Panoramate! Your Account is Ready
```

### 📝 Email Content

```
Great news, [firstName]!

Your registration for the [planName] plan has been approved.

Your account is now active and ready to use.

[BUTTON: Sign In Now] → {appUrl}/login

---

Your Temporary Password
[TEMPORARY_PASSWORD_HERE]

⚠️ Important: Please change this password immediately after your
first login for security.

If you have any questions, please don't hesitate to contact us.
```

### 🔐 Security Notes
- Temporary password is 12 characters (2 Uppercase + 4 Lowercase + 4 Digits + 2 Special)
- Example: `Mw7K4e@9#pQr`
- User MUST change password on first login
- Password is hashed in database (bcrypt)

### 💾 How It's Sent
```typescript
const approvalTemplate = getEmailTemplate('inscription-approved', {
  firstName: inscriptionRequest.firstName,
  planName: inscriptionRequest.type === 'PROFESSIONAL' ? 'Professional' : 'Free Trial',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || '...',
});

// Custom version with temporary password injected
const emailWithPassword = approvalTemplate.html.replace(
  '</p>',
  `</p>
  <h3>Your Temporary Password</h3>
  <p><strong>${temporaryPassword}</strong></p>
  <p><strong>⚠️ Important:</strong> Please change this password immediately after your first login for security.</p>
  <p></p>`
);

await sendEmail(
  inscriptionRequest.email,
  'Welcome to Panoramate! Your Account is Ready',
  emailWithPassword
);
```

---

## 5. INSCRIPTION REJECTION EMAIL

### 📌 TLDR
Sent by SUPER_ADMIN when rejecting an inscription request with optional reason.

### ✉️ When Sent
- When SUPER_ADMIN rejects: `POST /api/inscription-request/[id]/reject/route.ts`

### 📋 Required Variables
- `firstName`: User's first name
- `reason` (optional): Why registration was rejected
- `supportEmail`: Email for support inquiries

### 📧 Subject Line
```
About your Panoramate registration
```

### 📝 Email Content

```
Registration Status Update

Hi [firstName],

Thank you for your interest in Panoramate. Unfortunately, your
registration has been declined.

[IF REASON PROVIDED]
Reason: [reason]
[END IF]

If you believe this is a mistake, please contact us at
support@example.com
```

### 💾 Template Code
```typescript
getEmailTemplate('inscription-rejected', {
  firstName: 'John',
  reason: 'Domain verification required',
  supportEmail: 'support@panoramate.com',
})
```

---

## 6. PASSWORD RESET EMAIL

### 📌 TLDR
Sent when user requests password reset. Includes secure reset link.

### ✉️ When Sent
- User initiates password reset (not yet implemented)
- Future endpoint: `POST /api/auth/password-reset`

### 📋 Required Variables
- `resetLink`: Full reset URL with token

### 📧 Subject Line
```
Reset Your Panoramate Password
```

### 📝 Email Content

```
Password Reset Request

We received a request to reset your password.

[BUTTON: Reset Password] → {resetLink}

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.
```

### 💾 Template Code
```typescript
getEmailTemplate('password-reset', {
  resetLink: 'https://app.panoramate.com/reset-password?token=xyz789',
})
```

---

## 7. ADMIN NOTIFICATION EMAIL

### 📌 TLDR
Generic template for internal admin notifications (new inscription pending, system alerts, etc.)

### ✉️ When Sent
- Custom admin notifications (not currently automated)
- Future use: New inscription pending, system alerts, etc.

### 📋 Required Variables
- `title`: Notification title
- `message`: Main message
- `actionUrl` (optional): Link to take action
- `actionText` (optional): Button text

### 📧 Subject Line
```
[Admin] [title]
```

### 📝 Email Content

```
[title]

[message]

[IF ACTION PROVIDED]
[BUTTON: actionText] → {actionUrl}
[END IF]
```

### 💾 Template Code
```typescript
getEmailTemplate('admin-notification', {
  title: 'New Inscription Request Pending',
  message: 'John Doe submitted a Professional plan inscription request',
  actionUrl: 'https://app.panoramate.com/admin/inscriptions',
  actionText: 'Review Request',
})
```

---

## Email Sending Summary

| Template | Usage | When | Can Fail? |
|----------|-------|------|-----------|
| **welcome** | User onboarding | Registration/Approval | ⚠️ Non-blocking |
| **invitation** | Team collaboration | Member invite | ❌ Should log |
| **inscription-approved** | Account approval | After SUPER_ADMIN approval | ❌ Should log |
| **inscription-rejected** | Rejection notice | After SUPER_ADMIN rejection | ❌ Should log |
| **password-reset** | Account recovery | Future implementation | ❌ Should log |
| **admin-notification** | Internal alerts | Future use | ⚠️ Non-blocking |

---

## Implementation Notes

### Non-Blocking Email Failures
Some emails (welcome, admin-notification) use non-blocking sends:
```typescript
const emailResult = await sendEmail(...);
if (!emailResult.success) {
  logger.warn({ event: 'email_failed', ... });
  // Don't fail the request - user still registered
}
```

### Blocking Email Failures
Most emails log failures but may want to block in future:
```typescript
const emailResult = await sendEmail(...);
if (!emailResult.success) {
  logger.error({ event: 'email_failed', ... });
  // Currently doesn't block, but could be updated
}
```

### Email Variable Injection
Template variables use template literals:
```typescript
`<p>Hello ${data.firstName}!</p>`
```

---

## Testing Email Templates

### 1. Test Email Configuration
See `EMAIL_CONFIG.md` for setup instructions

### 2. Test Endpoint (if implemented)
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 3. Check Server Logs
```bash
npm run dev

# Look for:
# inscription_confirmation_email_sent
# inscription_confirmation_email_failed
# inscription_approval_email_sent
# inscription_approval_email_failed
```

---

## Future Modifications

To modify email templates:

1. Edit `src/lib/email.ts`
2. Update the corresponding `get[Template]Template()` function
3. Change subject, HTML content, or variables
4. No database migration needed
5. Restart dev server to apply changes

### Example: Change Welcome Email Subject
```typescript
// Before
subject: 'Welcome to Panoramate! 🎉',

// After
subject: 'You\'re in! Let\'s create amazing tours 🚀',
```

---

## Checklist for Email Testing

- [ ] Confirmation email received after inscription request
- [ ] Approval email with temp password received after SUPER_ADMIN approval
- [ ] Rejection email received after SUPER_ADMIN rejection
- [ ] Team invitation email received after invite
- [ ] Password reset email received on password reset request
- [ ] All links in emails are clickable and correct
- [ ] Temporary passwords work for login
- [ ] Email content is readable and professional
- [ ] No HTML rendering issues
- [ ] Mobile-friendly formatting

---

## Contact & Support

For email setup issues, see `EMAIL_CONFIG.md`
For email template issues, modify `src/lib/email.ts`
