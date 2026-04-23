import { PrismaClient } from './generated';
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from 'bcryptjs';

const pool = new PrismaMariaDb({
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
  adapter: pool,
});

async function main() {
  // Create plans
  const freeTrial = await prisma.plan.upsert({
    where: { planType: 'FREE_TRIAL' },
    update: {},
    create: {
      planType: 'FREE_TRIAL',
      name: 'Free Trial',
      priceMonthly: 0,
      priceYearly: 0,
      maxTours: 1,
      maxImagesPerTour: 10,
      maxStorageMb: 200,
      features: {
        create: [
          '1 Virtual Tour',
          '10 Scenes per Tour',
          '200 MB Storage',
          'Basic Editor',
          '14-Day Trial',
        ],
      },
    },
  });

  const starter = await prisma.plan.upsert({
    where: { planType: 'STARTER' },
    update: {},
    create: {
      planType: 'STARTER',
      name: 'Starter',
      priceMonthly: 2900,
      priceYearly: 29000,
      maxTours: 5,
      maxImagesPerTour: 50,
      maxStorageMb: 2048,
      stripePriceMonthlyId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      features: [
        '5 Virtual Tours',
        '50 Scenes per Tour',
        '2 GB Storage',
        'Advanced Editor',
        'Public Sharing',
        'Team Members (2)',
        'Email Support',
      ],
    },
  });

  const professional = await prisma.plan.upsert({
    where: { planType: 'PROFESSIONAL' },
    update: {},
    create: {
      planType: 'PROFESSIONAL',
      name: 'Professional',
      priceMonthly: 7900,
      priceYearly: 79000,
      maxTours: 20,
      maxImagesPerTour: 200,
      maxStorageMb: 10240,
      stripePriceMonthlyId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      features: [
        '20 Virtual Tours',
        '200 Scenes per Tour',
        '10 GB Storage',
        'Advanced Editor',
        'Public Sharing',
        'Team Members (10)',
        'Priority Support',
        'Analytics & Reporting',
        'Custom Branding',
      ],
    },
  });

  const enterprise = await prisma.plan.upsert({
    where: { planType: 'ENTERPRISE' },
    update: {},
    create: {
      planType: 'ENTERPRISE',
      name: 'Enterprise',
      priceMonthly: 19900,
      priceYearly: 199000,
      maxTours: -1,
      maxImagesPerTour: -1,
      maxStorageMb: 102400,
      stripePriceMonthlyId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      features: [
        'Unlimited Tours',
        'Unlimited Scenes',
        '100 GB Storage',
        'Advanced Editor',
        'Public Sharing',
        'Unlimited Team Members',
        '24/7 Phone Support',
        'Advanced Analytics',
        'White Label',
        'API Access',
        'Custom Integrations',
      ],
    },
  });

  // Create demo organization
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: 'FREE_TRIAL',
      subscriptionStatus: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxTours: 1,
      maxImagesPerTour: 10,
      totalStorageMb: 200,
    },
  });

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo1234!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@panoramate.com' },
    update: {},
    create: {
      email: 'demo@panoramate.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      role: 'ADMIN',
      organizationId: demoOrg.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('📋 Plans created:', { freeTrial, starter, professional, enterprise });
  console.log('🏢 Demo organization created:', demoOrg);
  console.log('👤 Demo user created:', demoUser);
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@panoramate.com');
  console.log('   Password: Demo1234!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
