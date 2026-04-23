import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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
  const org = await db.queryOne(
    'SELECT * FROM organizations WHERE stripeCustomerId = ?',
    [session.customer]
  ) as any;

  if (!org) return;

  const planType = session.metadata?.planType || 'STARTER';
  const planConfig = PLAN_CONFIG[planType] || PLAN_CONFIG.STARTER;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await db.execute(
    `UPDATE organizations
     SET plan = ?, stripeSubscriptionId = ?, stripePriceId = ?, subscriptionStatus = ?, currentPeriodEnd = ?, maxTours = ?, maxImagesPerTour = ?, totalStorageMb = ?, updatedAt = NOW()
     WHERE id = ?`,
    [planType, session.subscription, subscription.items.data[0]?.price.id, 'ACTIVE', currentPeriodEnd, planConfig.maxTours, planConfig.maxImagesPerTour, planConfig.totalStorageMb, org.id]
  );
}

async function handleSubscriptionUpdated(subscription: any) {
  const org = await db.queryOne(
    'SELECT * FROM organizations WHERE stripeSubscriptionId = ?',
    [subscription.id]
  ) as any;

  if (!org) return;

  const status =
    subscription.status === 'active'
      ? 'ACTIVE'
      : subscription.status === 'past_due'
      ? 'PAST_DUE'
      : subscription.status === 'canceled'
      ? 'CANCELED'
      : 'INCOMPLETE';

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await db.execute(
    'UPDATE organizations SET subscriptionStatus = ?, currentPeriodEnd = ?, updatedAt = NOW() WHERE id = ?',
    [status, currentPeriodEnd, org.id]
  );
}

async function handleSubscriptionDeleted(subscription: any) {
  const org = await db.queryOne(
    'SELECT * FROM organizations WHERE stripeSubscriptionId = ?',
    [subscription.id]
  ) as any;

  if (!org) return;

  await db.execute(
    `UPDATE organizations
     SET plan = ?, subscriptionStatus = ?, stripeSubscriptionId = NULL, stripePriceId = NULL, maxTours = ?, maxImagesPerTour = ?, totalStorageMb = ?, updatedAt = NOW()
     WHERE id = ?`,
    ['FREE_TRIAL', 'CANCELED', 1, 10, 200, org.id]
  );
}

async function handleInvoicePaid(invoice: any) {
  const org = await db.queryOne(
    'SELECT * FROM organizations WHERE stripeCustomerId = ?',
    [invoice.customer]
  ) as any;

  if (!org) return;

  // Check if invoice already exists
  const existingInvoice = await db.queryOne(
    'SELECT id FROM invoices WHERE stripeInvoiceId = ?',
    [invoice.id]
  ) as any;

  const paidAt = new Date(invoice.paid_at * 1000);
  const periodStart = new Date(invoice.period_start * 1000);
  const periodEnd = new Date(invoice.period_end * 1000);

  if (existingInvoice) {
    await db.execute(
      'UPDATE invoices SET status = ?, paidAt = ?, updatedAt = NOW() WHERE stripeInvoiceId = ?',
      ['PAID', paidAt, invoice.id]
    );
  } else {
    await db.execute(
      `INSERT INTO invoices (id, organizationId, stripeInvoiceId, invoiceNumber, amount, currency, status, pdfUrl, hostedUrl, periodStart, periodEnd, paidAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [uuidv4(), org.id, invoice.id, invoice.number, invoice.amount_paid, invoice.currency, 'PAID', invoice.pdf, invoice.hosted_invoice_url, periodStart, periodEnd, paidAt]
    );
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const org = await db.queryOne(
    'SELECT * FROM organizations WHERE stripeCustomerId = ?',
    [invoice.customer]
  ) as any;

  if (!org) return;

  // Check if invoice already exists
  const existingInvoice = await db.queryOne(
    'SELECT id FROM invoices WHERE stripeInvoiceId = ?',
    [invoice.id]
  ) as any;

  const periodStart = new Date(invoice.period_start * 1000);
  const periodEnd = new Date(invoice.period_end * 1000);

  if (existingInvoice) {
    await db.execute(
      'UPDATE invoices SET status = ?, updatedAt = NOW() WHERE stripeInvoiceId = ?',
      ['OPEN', invoice.id]
    );
  } else {
    await db.execute(
      `INSERT INTO invoices (id, organizationId, stripeInvoiceId, invoiceNumber, amount, currency, status, pdfUrl, hostedUrl, periodStart, periodEnd, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [uuidv4(), org.id, invoice.id, invoice.number, invoice.amount_due, invoice.currency, 'OPEN', invoice.pdf, invoice.hosted_invoice_url, periodStart, periodEnd]
    );
  }
}
