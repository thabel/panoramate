import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10' as any,
});

export const PLAN_LIMITS = {
  FREE_TRIAL: {
    maxTours: 2,
    maxImages: 10,
    storageMb: 200,
    priceMonthly: 0,
    priceYearly: 0,
  },
  STARTER: {
    maxTours: 5,
    maxImages: 50,
    storageMb: 2048,
    priceMonthly: 2900, // $29.00
    priceYearly: 29000, // $290.00
  },
  PROFESSIONAL: {
    maxTours: 20,
    maxImages: 200,
    storageMb: 10240,
    priceMonthly: 7900, // $79.00
    priceYearly: 79000, // $790.00
  },
  ENTERPRISE: {
    maxTours: -1,
    maxImages: -1,
    storageMb: 102400,
    priceMonthly: 19900, // $199.00
    priceYearly: 199000, // $1990.00
  },
};

export const PLAN_NAMES: Record<string, string> = {
  FREE_TRIAL: 'Free Trial',
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
};

export const PLAN_FEATURES: Record<string, string[]> = {
  FREE_TRIAL: [
    '1 Virtual Tour',
    '10 Scenes per Tour',
    '200 MB Storage',
    'Basic Editor',
    '14-Day Trial',
  ],
  STARTER: [
    '5 Virtual Tours',
    '50 Scenes per Tour',
    '2 GB Storage',
    'Advanced Editor',
    'Public Sharing',
    'Team Members (2)',
    'Email Support',
  ],
  PROFESSIONAL: [
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
  ENTERPRISE: [
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
};
