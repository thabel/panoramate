import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createFakeUser() {
  try {
    // Create or get organization
    const organization = await prisma.organization.upsert({
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

    console.log('✅ Organization created:', organization.name);

    // Create fake user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.upsert({
      where: { email: 'test@panoramate.com' },
      update: {},
      create: {
        email: 'test@panoramate.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'OWNER',
        isVerified: true,
        organizationId: organization.id,
      },
    });

    console.log('✅ Fake user created:');
    console.log('   Email: test@panoramate.com');
    console.log('   Password: password123');
    console.log('   Role: OWNER');

  } catch (error) {
    console.error('❌ Error creating fake user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFakeUser();
