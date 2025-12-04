import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { getAdminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Lazily create Stripe client and webhook secret at request time to avoid exposing secrets in build output.
 */
function getStripeClient(): Stripe | null {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string | undefined;
  if (!stripeSecretKey || stripeSecretKey === 'sk_test_...') return null;
  return new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
}

function getWebhookSecret(): string | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;
  if (!webhookSecret || webhookSecret === 'whsec_...') return null;
  return webhookSecret;
}

function getCreditsPerPrice(): { [key: string]: number } {
  return {
    [process.env.STRIPE_STARTER_PACK_PRICE_ID ?? '']: 40,
    [process.env.STRIPE_PRO_PACK_PRICE_ID ?? '']: 100,
    [process.env.STRIPE_SCALE_PACK_PRICE_ID ?? '']: 250,
  };
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
    return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error('Stripe client not configured.');
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const userId = session.client_reference_id;
  if (!userId) {
    console.error('❌ Missing userId in Stripe session client_reference_id');
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    if (session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0].price.id;
      const creditsToAdd = getCreditsPerPrice()[priceId] || 0;
      if (creditsToAdd > 0) {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ credits: FieldValue.increment(creditsToAdd) });
      }
    } else if (session.mode === 'payment') {
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
      const lineItems = sessionWithLineItems.line_items;
      const priceId = lineItems?.data?.[0]?.price?.id;
      const creditsToAdd = priceId ? getCreditsPerPrice()[priceId] : 0;
      if (creditsToAdd > 0) {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ credits: FieldValue.increment(creditsToAdd) });
      }
    }
  } catch (error: any) {
    console.error(`🔥 Firestore or Stripe API error: ${error?.message}`);
    return NextResponse.json({ error: 'Internal server error while updating user credits.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
    return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    console.error('Stripe client not configured.');
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  try {
    const userId = subscription.customer as string;
    const userSnapshot = await adminDb.collection('users').where('stripeCustomerId', '==', userId).get();
    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userDoc = userSnapshot.docs[0];

    if (subscription.status === 'active') {
      const priceId = subscription.items.data[0].price.id;
      const creditsToAdd = getCreditsPerPrice()[priceId] || 0;
      if (creditsToAdd > 0) {
        await userDoc.ref.update({ credits: FieldValue.increment(creditsToAdd) });
      }
    }
  } catch (error: any) {
    console.error(`🔥 Error handling subscription updated: ${error?.message}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();
  if (!stripe || !webhookSecret) {
    console.warn('Stripe webhook processing is disabled. Missing secret key.');
    return NextResponse.json({ message: 'Stripe webhook is not configured.' }, { status: 503 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
    return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
  }

  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err?.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err?.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return handleCheckoutSessionCompleted(session);
  }

  // Handle subscription renewal
  if (event.type === 'invoice.payment_succeeded' && (event.data.object as Stripe.Invoice).subscription) {
    const invoice = event.data.object as Stripe.Invoice;
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    return handleSubscriptionUpdated(subscription);
  }

  return NextResponse.json({ received: true });
}
