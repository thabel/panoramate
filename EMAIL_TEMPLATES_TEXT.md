# Email Templates - Text View

This document shows the EXACT text that users will see in their email clients.

---

## 1️⃣ WELCOME EMAIL (Inscription Confirmation)

**Subject:** `Thank you for your Panoramate registration request`

**Recipient:** User who submitted inscription form

**Sent:** Immediately after form submission

---

```
Welcome to Panoramate, John!

We're excited to have you on board. You can now create and share
immersive 360° virtual tours.

┌─────────────────────────┐
│  Go to Dashboard        │
└─────────────────────────┘
   https://app.panoramate.com/dashboard

If you have any questions, feel free to contact our support team.
```

**Plain Text Version:**
```
Welcome to Panoramate, John!

We're excited to have you on board. You can now create and share
immersive 360° virtual tours.

Go to Dashboard: https://app.panoramate.com/dashboard

If you have any questions, feel free to contact our support team.
```

**Notes:**
- ⚠️ May FAIL if user provided fake email (non-blocking)
- ✅ Request still succeeds if email fails
- 📝 Check logs: "inscription_confirmation_email_sent" or "inscription_confirmation_email_failed"

---

## 2️⃣ TEAM INVITATION EMAIL

**Subject:** `You've been invited to Acme Corp on Panoramate`

**Recipient:** Person being invited to team

**Sent:** When ADMIN or MEMBER invites them

---

```
You're invited to collaborate!

John Doe has invited you to join Acme Corp on Panoramate.

┌─────────────────────────┐
│  Accept Invitation      │
└─────────────────────────┘
   https://app.panoramate.com/invite?token=abc123xyz...

This invitation will expire in 7 days.
```

**Plain Text Version:**
```
You're invited to collaborate!

John Doe has invited you to join Acme Corp on Panoramate.

Accept Invitation: https://app.panoramate.com/invite?token=abc123xyz...

This invitation will expire in 7 days.
```

---

## 3️⃣ INSCRIPTION APPROVAL EMAIL (WITH PASSWORD)

**Subject:** `Welcome to Panoramate! Your Account is Ready`

**Recipient:** User whose inscription was approved by SUPER_ADMIN

**Sent:** Immediately after SUPER_ADMIN clicks "Approve"

---

```
Great news, John!

Your registration for the Professional plan has been approved.

Your account is now active and ready to use.

┌─────────────────────────┐
│  Sign In Now            │
└─────────────────────────┘
   https://app.panoramate.com/login

═══════════════════════════════════════════════════════════
Your Temporary Password

Mw7K4e@9#pQr

⚠️ Important: Please change this password immediately after your
first login for security.
═══════════════════════════════════════════════════════════

If you have any questions, please don't hesitate to contact us.
```

**Plain Text Version:**
```
Great news, John!

Your registration for the Professional plan has been approved.

Your account is now active and ready to use.

Sign In Now: https://app.panoramate.com/login

---

Your Temporary Password

Mw7K4e@9#pQr

⚠️ Important: Please change this password immediately after your
first login for security.

---

If you have any questions, please don't hesitate to contact us.
```

**Login Flow:**
```
1. User receives email with temporary password
2. User goes to: https://app.panoramate.com/login
3. User enters: Email + Temporary Password
4. System: "Password change required"
5. User: Changes password to new secure password
6. Access: Dashboard unlocked ✅
```

**Password Details:**
- Length: 12 characters
- Composition: 2 Upper + 4 Lower + 4 Digits + 2 Special (!@#$%^&*)
- Example: `Mw7K4e@9#pQr`
- Status: Temporary (must change on first login)

---

## 4️⃣ INSCRIPTION REJECTION EMAIL

**Subject:** `About your Panoramate registration`

**Recipient:** User whose inscription was rejected

**Sent:** When SUPER_ADMIN clicks "Reject"

---

```
Registration Status Update

Hi John,

Thank you for your interest in Panoramate. Unfortunately, your
registration has been declined.

Reason: Domain verification required

If you believe this is a mistake, please contact us at
support@panoramate.com
```

**With Optional Reason:**
```
Registration Status Update

Hi John,

Thank you for your interest in Panoramate. Unfortunately, your
registration has been declined.

Reason: We require businesses with established track records

If you believe this is a mistake, please contact us at
support@panoramate.com
```

**Without Reason:**
```
Registration Status Update

Hi John,

Thank you for your interest in Panoramate. Unfortunately, your
registration has been declined.

If you believe this is a mistake, please contact us at
support@panoramate.com
```

---

## 5️⃣ PASSWORD RESET EMAIL

**Subject:** `Reset Your Panoramate Password`

**Recipient:** User requesting password reset

**Sent:** When user initiates password reset (not yet implemented)

---

```
Password Reset Request

We received a request to reset your password.

┌─────────────────────────┐
│  Reset Password         │
└─────────────────────────┘
   https://app.panoramate.com/reset?token=xyz789...

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.
```

**Plain Text Version:**
```
Password Reset Request

We received a request to reset your password.

Reset Password: https://app.panoramate.com/reset?token=xyz789...

This link will expire in 24 hours.

If you didn't request this, you can safely ignore this email.
```

---

## 6️⃣ ADMIN NOTIFICATION EMAIL

**Subject:** `[Admin] New Inscription Request Pending`

**Recipient:** Admin/staff email addresses

**Sent:** When new inscription request arrives (future automation)

---

```
New Inscription Request Pending

John Doe submitted a Professional plan inscription request

┌─────────────────────────┐
│  Review Request         │
└─────────────────────────┘
   https://app.panoramate.com/admin/inscriptions

```

**Variations:**
```
Example 1 - New User Alert:
[Admin] New Professional Plan Request
Jane Smith just requested a Professional plan account

Example 2 - System Alert:
[Admin] Email Service Degradation
Email sending failed 50 times in last hour
```

---

## 📊 Email Sending Flow Diagram

```
User Action                  Email Sent                Status
────────────────────────────────────────────────────────────

Inscription Form             Confirmation              ⚠️ Can fail (non-blocking)
Submit                       Email                     ✅ Request succeeds anyway

                             ↓ (after 7 days of review)

SUPER_ADMIN                  Approval Email            ❌ Must succeed
Clicks "Approve"            + Password                (account created anyway)

                             ↓ OR

SUPER_ADMIN                  Rejection Email          ❌ Should log failure
Clicks "Reject"

                             ↓ OR

Team Member                  Invitation Email         ✅ 7-day expiration
Invites Someone
```

---

## 🎯 Quick Reference

| Email Type | Subject Starts With | When | Critical? |
|-----------|------------------|------|-----------|
| Confirmation | "Thank you for..." | Form submitted | ⚠️ Non-blocking |
| Approval | "Welcome to Panoramate!" | After SUPER_ADMIN approve | ❌ Must log |
| Rejection | "About your..." | After SUPER_ADMIN reject | ✅ Should log |
| Invitation | "You've been invited..." | After team invite | ✅ Should log |
| Reset | "Reset Your..." | Password reset request | ✅ Should log |
| Admin Alert | "[Admin]" | System events | ⚠️ Non-blocking |

---

## ✅ Quality Checklist

Review each email for:

- [ ] **Greeting:** Uses user's first name (personalized)
- [ ] **Clarity:** Main point is clear in first paragraph
- [ ] **Action:** Has a clear call-to-action button/link
- [ ] **Security:** Warns about passwords, link expiration, etc.
- [ ] **Tone:** Professional, friendly, helpful
- [ ] **Branding:** Includes company name/logo (if applicable)
- [ ] **Links:** All URLs are complete and functional
- [ ] **Mobile:** Works on phone screens
- [ ] **Plain Text:** Readable without HTML rendering

---

## 💡 Suggestions for Improvement

### Current Issues to Consider:

1. **Missing Branding**
   - Add logo or company colors
   - Add unsubscribe link (if applicable)
   - Add footer with contact info

2. **Missing Urgency/Value Props**
   - Welcome email: Could mention "quick start guide"
   - Approval email: Could list plan benefits
   - Rejection email: Could suggest contacting sales

3. **Missing Support Info**
   - No phone number/support contact
   - No FAQ links
   - No documentation links

4. **Password Email**
   - Could include "How to change password" link
   - Could include security best practices

### Example Improvements:

```
BEFORE:
If you have any questions, feel free to contact our support team.

AFTER:
Need help? Check our FAQ or contact support@panoramate.com
📚 Documentation: https://docs.panoramate.com
📧 Email: support@panoramate.com
☎️ Phone: +1-555-PANORAMA
```

---

## Configuration Variables

Emails use these environment variables:

```bash
# Email Provider
EMAIL_PROVIDER=smtp                    # smtp, sendgrid, mailgun
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=...
EMAIL_SMTP_PASS=...

# From Address
EMAIL_FROM_NAME=Panoramate
EMAIL_FROM_ADDRESS=noreply@panoramate.com

# App Links
NEXT_PUBLIC_APP_URL=https://app.panoramate.com
```

---

## Testing Steps

1. **Setup email provider** (see EMAIL_CONFIG.md)
2. **Set environment variables** in .env.local
3. **Create test account** with your test email
4. **Submit inscription form** → Check inbox for confirmation
5. **Login as SUPER_ADMIN** → Approve request → Check email
6. **Click approval email link** → Login with temp password
7. **Verify** password change required on first login

---

## Rendering Issues to Check

- [ ] Buttons are clickable (not just links)
- [ ] Images render correctly
- [ ] Spacing/padding looks good
- [ ] Font sizes readable on mobile
- [ ] Colors display correctly
- [ ] Emojis render (🎉 ✅ ⚠️ etc.)
- [ ] HTML entities display (© ® ™)
- [ ] No truncated text
