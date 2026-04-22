# Create User - Simple Guide

## Quick Start

```bash
npm run create-user
```

This launches an interactive CLI to create new users.

---

## Prerequisites

1. **Development server must be running:**
   ```bash
   npm run dev
   ```

2. **In another terminal, run the create user script:**
   ```bash
   npm run create-user
   ```

---

## Usage

### Step 1: Start the Script
```bash
npm run create-user
```

### Step 2: Answer the Prompts

```
🎯 Create New User

📧 Email address: john@example.com
👤 First name: John
👤 Last name: Doe

📋 Available Roles:
   1. SUPER_ADMIN  - SaaS platform administrator (manually assigned)
   2. ADMIN        - Organization administrator
   3. MEMBER       - Standard team member
   4. VIEWER       - Read-only access

🔐 Select role (1-4) [default: 2]: 1

🔑 Generate secure password? (y/n) [default: y]: y
Generated password: Mw7K4e@9#pQr

🏢 Organization:
Create new organization? (y/n) [default: n]: y
Organization name: Acme Corporation
Slug will be: "acme-corporation" (ok? y/n): y
```

### Step 3: User Created

```
✅ User created successfully!

═══════════════════════════════════════
📋 User Details:
═══════════════════════════════════════
   Email:        john@example.com
   Name:         John Doe
   Password:     Mw7K4e@9#pQr
   Role:         SUPER_ADMIN
   Organization: Acme Corporation
   Verified:     ✅ Yes
═══════════════════════════════════════

🎯 Next steps:
   1. Go to: http://localhost:3000/login
   2. Login with:
      Email:    john@example.com
      Password: Mw7K4e@9#pQr

⚠️  This is a SUPER_ADMIN account!
   You can manage inscription requests at:
   http://localhost:3000/admin/inscriptions
```

---

## Roles Explained

| Role | Description | Use Case |
|------|-------------|----------|
| **SUPER_ADMIN** | SaaS platform administrator (manually assigned only) | Approve/reject user registrations, platform management |
| **ADMIN** | Organization administrator | Manage organization, invite team members, create tours |
| **MEMBER** | Team member with editing rights | Create and edit tours, upload images |
| **VIEWER** | Read-only team member | View tours, cannot create or edit |

---

## Password Options

### Auto-Generate (Recommended)
- **Length:** 12 characters
- **Format:** 2 Uppercase + 4 Lowercase + 4 Digits + 2 Special
- **Example:** `Mw7K4e@9#pQr`
- **Secure:** Randomized and difficult to guess

### Custom Password
- **Minimum:** 8 characters
- **Recommended:** Mix uppercase, lowercase, digits, and special characters
- **Example:** `MySecurePass123!`

---

## Organization Options

### Create New Organization
- Creates a new organization with FREE_TRIAL plan
- 14-day trial period
- User becomes ADMIN of the new organization

### Use Existing Organization
- Default: Uses "test-org" (created automatically if missing)
- User is added to existing organization
- Respects selected role

---

## Examples

### Create SUPER_ADMIN User
```bash
npm run create-user

# Answers:
# Email: admin@example.com
# First name: Platform
# Last name: Admin
# Role: 1 (SUPER_ADMIN)
# Password: (auto-generate)
# Organization: (use default)
```

### Create ADMIN for New Client
```bash
npm run create-user

# Answers:
# Email: client@clientcompany.com
# First name: Jane
# Last name: Client
# Role: 2 (ADMIN)
# Password: (auto-generate)
# Organization: (create new) → "Client Company Inc"
```

### Add Team Member
```bash
npm run create-user

# Answers:
# Email: creator@example.com
# First name: Content
# Last name: Creator
# Role: 3 (MEMBER)
# Password: (auto-generate)
# Organization: (use existing) → "test-org"
```

---

## Troubleshooting

### "Make sure the development server is running"
**Solution:** Start the dev server in another terminal:
```bash
npm run dev
```

### Email already exists
**Solution:** Use a different email address, or delete the user via Prisma Studio:
```bash
npm run db:studio
```

### Need to Reset a User's Password?
Use Prisma Studio:
```bash
npm run db:studio
# Find the user and manually update the password field
```

---

## Related Commands

```bash
# Create user (NEW - Simple version)
npm run create-user

# Create user (OLD - TypeScript version, requires Prisma client)
npm run db:create-user

# View database visually
npm run db:studio

# Apply database migrations
npm run db:push

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

---

## Security Notes

✅ Passwords are hashed with bcrypt before storage
✅ Auto-generated passwords are 12 characters with mixed types
✅ Users are immediately verified (no email confirmation needed)
✅ Script runs locally only (not accessible in production)
✅ No sensitive data logged to console

---

## Tips

💡 **Open two terminals:** One for `npm run dev`, one for `npm run create-user`
💡 **Save credentials:** Copy the summary output for safekeeping
💡 **Test different roles:** Create multiple users to test each role
💡 **Use SUPER_ADMIN first:** Test admin features before regular users
💡 **Custom passwords:** Press 'n' at password prompt to enter your own

---

## Need Help?

- **Roles & Permissions:** See `RBAC_QUICK_REFERENCE.md`
- **Email Setup:** See `EMAIL_CONFIG.md`
- **Email Templates:** See `EMAIL_TEMPLATES.md`
- **Architecture:** See `CLAUDE.md`
