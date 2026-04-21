import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface UserInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  organizationName?: string;
  organizationSlug?: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function generateSecurePassword(): Promise<string> {
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

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function getUserInput(): Promise<UserInput> {
  console.log('\n🎯 Create New User\n');

  const email = await prompt('📧 Email address: ');
  const firstName = await prompt('👤 First name: ');
  const lastName = await prompt('👤 Last name: ');

  console.log('\n📋 Available Roles:');
  console.log('   1. SUPER_ADMIN  - SaaS platform administrator');
  console.log('   2. ADMIN        - Organization administrator');
  console.log('   3. MEMBER       - Standard team member');
  console.log('   4. VIEWER       - Read-only access');

  let roleInput = await prompt('\n🔐 Select role (1-4) [default: 2]: ');
  if (!roleInput) roleInput = '2';

  const roleMap: { [key: string]: UserRole } = {
    '1': 'SUPER_ADMIN',
    '2': 'ADMIN',
    '3': 'MEMBER',
    '4': 'VIEWER',
  };

  const role: UserRole = roleMap[roleInput] || 'ADMIN';

  console.log('\n🔑 Password Options:');
  const passwordChoice = await prompt('Generate secure password? (y/n) [default: y]: ');
  let password: string;

  if (passwordChoice.toLowerCase() === 'n') {
    password = await prompt('Enter password: ');
  } else {
    password = await generateSecurePassword();
    console.log(`Generated password: ${password}`);
  }

  console.log('\n🏢 Organization:');
  const orgChoice = await prompt('Create new organization? (y/n) [default: n]: ');

  let organizationName: string | undefined;
  let organizationSlug: string | undefined;

  if (orgChoice.toLowerCase() === 'y') {
    organizationName = await prompt('Organization name: ');
    organizationSlug = organizationName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const slugConfirm = await prompt(`Slug will be: "${organizationSlug}" (ok? y/n): `);
    if (slugConfirm.toLowerCase() === 'n') {
      organizationSlug = await prompt('Enter slug: ');
    }
  }

  return {
    email,
    firstName,
    lastName,
    password,
    role,
    organizationName,
    organizationSlug,
  };
}

async function createUser(input: UserInput): Promise<void> {
  try {
    console.log('\n⏳ Creating user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      console.log(`❌ User with email ${input.email} already exists`);
      return;
    }

    // Create or get organization
    let organization;

    if (input.organizationName && input.organizationSlug) {
      // Create new organization
      organization = await prisma.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug,
          plan: 'FREE_TRIAL',
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✅ Organization created: ${organization.name}`);
    } else {
      // Use or create default organization
      organization = await prisma.organization.upsert({
        where: { slug: 'test-org' },
        update: {},
        create: {
          name: 'Test Organization',
          slug: 'test-org',
          plan: 'FREE_TRIAL',
          subscriptionStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✅ Using organization: ${organization.name}`);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        isVerified: true,
        organizationId: organization.id,
      },
    });

    // Display success message
    console.log('\n✅ User created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📋 User Details:');
    console.log('═══════════════════════════════════════');
    console.log(`   Email:        ${user.email}`);
    console.log(`   Name:         ${user.firstName} ${user.lastName}`);
    console.log(`   Password:     ${input.password}`);
    console.log(`   Role:         ${user.role}`);
    console.log(`   Organization: ${organization.name}`);
    console.log(`   Verified:     ${user.isVerified ? '✅ Yes' : '❌ No'}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🎯 Next steps:');
    console.log(`   1. Start dev server: npm run dev`);
    console.log(`   2. Go to: http://localhost:3000/login`);
    console.log(`   3. Login with:`);
    console.log(`      Email:    ${user.email}`);
    console.log(`      Password: ${input.password}`);

    if (input.role === 'SUPER_ADMIN') {
      console.log(`\n⚠️  This is a SUPER_ADMIN account!`);
      console.log(`   You can manage inscription requests at:`);
      console.log(`   http://localhost:3000/admin/inscriptions`);
    }

    console.log();
  } catch (error) {
    console.error('❌ Error creating user:', error);
    if (error instanceof Error) {
      console.error('   Details:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  try {
    const input = await getUserInput();
    rl.close();
    await createUser(input);
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
