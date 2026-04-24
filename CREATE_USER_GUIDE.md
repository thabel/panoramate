# Create User Script Guide

Interactive script to create users with specific roles and organizations.

## Quick Start

```bash
npm run db:create-user
```

This launches an interactive CLI that guides you through creating a new user.

---

## Features

✅ **Interactive prompts** - Easy CLI interface
✅ **Role selection** - Choose from SUPER_ADMIN, ADMIN, MEMBER, VIEWER
✅ **Password generation** - Auto-generate secure passwords or enter custom
✅ **Organization management** - Create new org or use existing
✅ **Email validation** - Prevents duplicate user creation
✅ **Display credentials** - Shows summary with login info

---

## Usage

### Step 1: Start the Script

```bash
npm run db:create-user
```

### Step 2: Answer Prompts

```
🎯 Create New User

📧 Email address: john@example.com
👤 First name: John
👤 Last name: Doe

📋 Available Roles:
   1. SUPER_ADMIN  - SaaS platform administrator
   2. ADMIN        - Organization administrator
   3. MEMBER       - Standard team member
   4. VIEWER       - Read-only access

🔐 Select role (1-4) [default: 2]: 1

🔑 Password Options:
Generate secure password? (y/n) [default: y]: y
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
   1. Start dev server: npm run dev
   2. Go to: http://localhost:3000/login
   3. Login with:
      Email:    john@example.com
      Password: Mw7K4e@9#pQr

⚠️  This is a SUPER_ADMIN account!
   You can manage inscription requests at:
   http://localhost:3000/admin/inscriptions
```

---

## Role Descriptions

### 1. SUPER_ADMIN
- **Purpose**: Platform/system administrator
- **Capabilities**:
  - View inscription requests dashboard
  - Approve/reject user registration requests
  - Create organization automatically on approval
  - Send temporary passwords to new users
  - Exempt from plan limits (unlimited resources)
- **Use Case**: Admin team members who manage platform operations

### 2. ADMIN
- **Purpose**: Organization administrator
- **Capabilities**:
  - Create/edit/delete tours
  - Upload/delete images
  - Create hotspots
  - Invite team members
  - Manage team member roles
  - Invite MEMBER and VIEWER users
  - Exempt from plan limits (unlimited resources)
- **Use Case**: Organization owners and team leads

### 3. MEMBER
- **Purpose**: Team member with full editing access
- **Capabilities**:
  - Create/edit/delete tours
  - Upload/delete images
  - Create hotspots
  - Invite other members (MEMBER and VIEWER only)
  - Subject to plan limits
- **Use Case**: Content creators and team members

### 4. VIEWER
- **Purpose**: Read-only team member
- **Capabilities**:
  - View tours and content
  - Cannot create, edit, or delete anything
  - Cannot invite others
  - Subject to plan limits
- **Use Case**: Stakeholders, reviewers, clients

---

## Password Options

### Auto-Generated (Recommended)

```bash
Generate secure password? (y/n) [default: y]: y
```

- **Length**: 12 characters
- **Format**: 2 uppercase + 4 lowercase + 4 digits + 2 special
- **Example**: `Mw7K4e@9#pQr`
- **Secure**: Randomized, difficult to guess
- **Displayed**: Shown in terminal for immediate login

### Custom Password

```bash
Generate secure password? (y/n) [default: y]: n
Enter password: MySecurePassword123!
```

- **Minimum**: 8 characters (enforced by login endpoint)
- **Recommended**: Mix uppercase, lowercase, digits, special chars
- **You Choose**: Any password of your preference

---

## Organization Options

### Create New Organization

```bash
Create new organization? (y/n) [default: n]: y
Organization name: My Company
Slug will be: "my-company" (ok? y/n): y
```

- **Creates**: New organization with FREE_TRIAL plan
- **Storage**: 500MB
- **Tours**: 1 (FREE_TRIAL limit)
- **Trial**: 14 days
- **User Role**: ADMIN (first user of new org)

### Use Existing Organization

```bash
Create new organization? (y/n) [default: n]: n
```

- **Default**: Uses "test-org" (created if doesn't exist)
- **User Added**: To existing organization
- **Role Respected**: User gets selected role

---

## Examples

### Create SUPER_ADMIN for Testing

```bash
$ npm run db:create-user

📧 Email address: admin@example.com
👤 First name: Platform
👤 Last name: Admin
🔐 Select role (1-4): 1  # SUPER_ADMIN
🔑 Generate password? (y/n): y
🏢 Create new organization? (y/n): n
```

**Result:**
- Email: `admin@example.com`
- Role: `SUPER_ADMIN`
- Organization: `test-org`
- Access: `/admin/inscriptions` dashboard

### Create MEMBER in Existing Org

```bash
$ npm run db:create-user

📧 Email address: creator@example.com
👤 First name: Content
👤 Last name: Creator
🔐 Select role (1-4): 3  # MEMBER
🔑 Generate password? (y/n): y
🏢 Create new organization? (y/n): n
```

**Result:**
- Email: `creator@example.com`
- Role: `MEMBER`
- Organization: `test-org`
- Access: Can create tours, limited by plan

### Create ADMIN for New Client

```bash
$ npm run db:create-user

📧 Email address: client@clientcompany.com
👤 First name: Jane
👤 Last name: Client
🔐 Select role (1-4): 2  # ADMIN
🔑 Generate password? (y/n): y
🏢 Create new organization? (y/n): y
Organization name: Client Company Inc
Slug: client-company-inc
```

**Result:**
- Email: `client@clientcompany.com`
- Role: `ADMIN`
- Organization: `Client Company Inc` (new)
- Access: Full org admin capabilities

---

## Database Impact

When you create a user, the script:

1. **Checks** if email already exists
2. **Creates** organization (if needed)
3. **Creates** user with specified role
4. **Hashes** password with bcrypt
5. **Marks** user as verified

No other data is affected.

---

## Error Handling

### Email Already Exists

```
❌ User with email john@example.com already exists
```

**Solution**: Use a different email address

### Database Connection Failed

```
❌ Error creating user: PrismaClientInitializationError
```

**Solutions**:
- Ensure DATABASE_URL is set in .env.local
- Check database is running
- Run `npm run db:push` to apply migrations

### Invalid Input

```
❌ Error: Organization name is required
```

**Solution**: Provide all required information when prompted

---

## Security Notes

✅ Passwords are **hashed with bcrypt** before storage
✅ Auto-generated passwords are **cryptographically secure**
✅ Users marked as **verified=true** (skip email verification)
✅ No sensitive data logged to console
✅ Script runs **locally only** (not in production)

---

## Comparison: Old vs New Script

| Feature | `create-test-user.ts` | `create-user.ts` |
|---------|----------------------|------------------|
| Interactive CLI | ❌ No | ✅ Yes |
| Role Selection | ❌ Fixed (OWNER) | ✅ SUPER_ADMIN/ADMIN/MEMBER/VIEWER |
| Custom Password | ❌ No | ✅ Yes |
| Password Generation | ❌ No | ✅ Yes, secure |
| New Organization | ❌ No | ✅ Optional |
| Email Validation | ❌ No | ✅ Yes |
| User Summary | ❌ Basic | ✅ Detailed |
| Error Messages | ❌ Generic | ✅ Descriptive |

---

## Common Tasks

### Create Admin User for Testing

```bash
npm run db:create-user
# Select role 2 (ADMIN)
# Use default org or create new
```

### Create SUPER_ADMIN to Approve Inscriptions

```bash
npm run db:create-user
# Select role 1 (SUPER_ADMIN)
# Login to http://localhost:3000/admin/inscriptions
```

### Add Team Member

```bash
npm run db:create-user
# Select role 3 (MEMBER)
# Use existing organization
```

### Create Read-Only Viewer

```bash
npm run db:create-user
# Select role 4 (VIEWER)
# Use existing organization
```

---

## Related Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Create old-style test user
npm run db:create-test-user

# Create new interactive user (NEW)
npm run db:create-user
```

---

## Troubleshooting

### "Cannot find module 'readline'"

**Error**: Usually doesn't happen (readline is built-in Node.js)

**Solution**:
```bash
npm install
npm run dev  # Restart dev server
```

### User created but can't login

**Check**:
1. Email address spelling
2. Password (case-sensitive)
3. User is verified (✅ Yes)
4. Database connection is working

**Debug**:
```bash
npm run db:studio
# Find user and verify details
```

### Duplicate user error

**Problem**: Email already exists

**Solution**:
- Use different email
- Delete old user via `npm run db:studio`
- Try again

---

## Next Steps After Creating User

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Go to login page**
   ```
   http://localhost:3000/login
   ```

3. **Login with provided credentials**
   - Email: (from script output)
   - Password: (from script output)

4. **Complete first login**
   - Password change (recommended for SUPER_ADMIN)
   - Set profile information
   - Start using platform

---

## Tips

💡 **Save credentials**: Copy the summary output for reference
💡 **Test different roles**: Create multiple users to test each role
💡 **Use SUPER_ADMIN first**: Test admin features before regular users
💡 **Reset if needed**: Delete and recreate in `npm run db:studio`
💡 **Organize slugs**: Use meaningful organization slugs for testing

---

## Questions?

Check related documentation:
- **Roles**: See CLAUDE.md or RBAC_QUICK_REFERENCE.md
- **Architecture**: See CLAUDE.md for system overview
- **Email**: See EMAIL_CONFIG.md and EMAIL_TEMPLATES.md
