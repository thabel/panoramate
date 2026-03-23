import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

const PLAN_CONFIG: Record<string, any> = {
  STARTER: {
    maxTours: 5,
    maxImagesPerTour: 50,
    totalStorageMb: 2048,
  },
  PROFESSIONAL: {
    maxTours: 20,
    maxImagesPerTour: 200,
    totalStorageMb: 10240,
  },
  ENTERPRISE: {
    maxTours: -1,
    maxImagesPerTour: -1,
    totalStorageMb: 102400,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  if (!session.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const org = await db.organization.findFirst({
    where: {
      stripeCustomerId: session.customer,
    },
  });

  if (!org) return;

  const planType = session.metadata?.planType || 'STARTER';
  const planConfig = PLAN_CONFIG[planType] || PLAN_CONFIG.STARTER;

  await db.organization.update({
    where: { id: org.id },
    data: {
      plan: planType,
      stripeSubscriptionId: session.subscription,
      stripePriceId: subscription.items.data[0]?.price.id,
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      ...planConfig,
    },
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  const org = await db.organization.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!org) return;

  const status =
    subscription.status === 'active'
      ? 'ACTIVE'
      : subscription.status === 'past_due'
      ? 'PAST_DUE'
      : subscription.status === 'canceled'
      ? 'CANCELED'
      : 'INCOMPLETE';

  await db.organization.update({
    where: { id: org.id },
    data: {
      subscriptionStatus: status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: any) {
  const org = await db.organization.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!org) return;

  await db.organization.update({
    where: { id: org.id },
    data: {
      plan: 'FREE_TRIAL',
      subscriptionStatus: 'CANCELED',
      stripeSubscriptionId: null,
      stripePriceId: null,
      maxTours: 1,
      maxImagesPerTour: 10,
      totalStorageMb: 200,
    },
  });
}

async function handleInvoicePaid(invoice: any) {
  const org = await db.organization.findFirst({
    where: {
      stripeCustomerId: invoice.customer,
    },
  });

  if (!org) return;

  await db.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: 'PAID',
      paidAt: new Date(invoice.paid_at * 1000),
    },
    create: {
      organizationId: org.id,
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'PAID',
      pdfUrl: invoice.pdf,
      hostedUrl: invoice.hosted_invoice_url,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(invoice.paid_at * 1000),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: any) {
  const org = await db.organization.findFirst({
    where: {
      stripeCustomerId: invoice.customer,
    },
  });

  if (!org) return;

  await db.invoice.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: 'OPEN',
    },
    create: {
      organizationId: org.id,
      stripeInvoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'OPEN',
      pdfUrl: invoice.pdf,
      hostedUrl: invoice.hosted_invoice_url,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
    },
  });
}
