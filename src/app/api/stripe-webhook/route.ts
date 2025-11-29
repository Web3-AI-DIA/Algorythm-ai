import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// Initialize Stripe only if the key is not a placeholder
const stripe = stripeSecretKey && stripeSecretKey !== 'sk_test_...' ? new Stripe(stripeSecretKey) : null;


// Maps Stripe Price IDs to credits
const creditsPerPrice: { [key: string]: number } = {
  [process.env.STRIPE_STARTER_PACK_PRICE_ID!]: 40,
  [process.env.STRIPE_PRO_PACK_PRICE_ID!]: 100,
  [process.env.STRIPE_SCALE_PACK_PRICE_ID!]: 250,
};

async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
    if (!adminDb) {
        console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
        return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
    }

    const customerId = subscription.customer as string;
    const userSnapshot = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).get();

    if (userSnapshot.empty) {
        // If the user is not found by stripeCustomerId, it might be the first payment
        // of a new subscription, so the stripeCustomerId is not stored yet.
        // In this case, we can't handle the event, but we should not return an error.
        console.warn(`🤷 No user found with Stripe customer ID: ${customerId}. This might be a new subscription.`);
        return NextResponse.json({ received: true });
    }
    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    const priceId = subscription.items.data[0].price.id;
    const creditsToAdd = creditsPerPrice[priceId] || 0;

    const subscriptionData = {
        status: subscription.status,
        planId: priceId,
        current_period_end: new Date(subscription.current_period_end * 1000),
    };

    try {
        switch (eventType) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await userDoc.ref.update({ subscription: subscriptionData });
                console.log(`✅ Subscription ${eventType} for user ${userId}`);
                break;
            case 'customer.subscription.deleted':
                await userDoc.ref.update({ subscription: { status: 'canceled' } });
                console.log(`✅ Subscription canceled for user ${userId}`);
                break;
            case 'invoice.payment_succeeded':
                if (creditsToAdd > 0) {
                    await userDoc.ref.update({
                        credits: FieldValue.increment(creditsToAdd),
                        subscription: subscriptionData
                    });
                    console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId} for subscription renewal.`);
                }
                break;
            default:
                console.log(`🤷 Unhandled event type: ${eventType}`);
        }
    } catch (error: any) {
        console.error(`🔥 Firestore error: ${error.message}`);
        return NextResponse.json({ error: 'Internal server error while updating subscription.' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (!adminDb) {
        console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
        return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
    }

    const userId = session.client_reference_id;
    if (!userId) {
        console.error('❌ Missing userId in Stripe session client_reference_id');
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (session.mode === 'subscription' && session.customer) {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ stripeCustomerId: session.customer });
        console.log(`✅ Associated Stripe customer ${session.customer} with user ${userId}`);
    }

    // The initial credit allocation is handled by the 'invoice.payment_succeeded' event
    return NextResponse.json({ received: true });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    if (!adminDb) {
        console.error('Firestore Admin SDK not initialized. Cannot process webhook.');
        return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
    }
    const userId = subscription.customer as string; 
    const userSnapshot = await adminDb.collection('users').where('stripeCustomerId', '==', userId).get();

    if (userSnapshot.empty) {
        console.error(`❌ No user found with Stripe customer ID: ${userId}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userDoc = userSnapshot.docs[0];


    if (subscription.status === 'active') {
        const priceId = subscription.items.data[0].price.id;
        const creditsToAdd = creditsPerPrice[priceId] || 0;

        if (creditsToAdd > 0) {
            await userDoc.ref.update({
                credits: FieldValue.increment(creditsToAdd)
            });
            console.log(`✅ Successfully renewed subscription and added ${creditsToAdd} credits to user ${userDoc.id}`);
        }
    }
     return NextResponse.json({ received: true });
}


export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret || webhookSecret === 'whsec_...') {
    console.warn('Stripe webhook processing is disabled. Missing secret key.');
    return NextResponse.json({ message: 'Stripe webhook is not configured.' }, { status: 503 });
  }
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
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle subscription events
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      return handleCheckoutSessionCompleted(session);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      return handleSubscriptionEvent(subscription, event.type);

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        return handleSubscriptionEvent(subscription, event.type);
      }
      break;

    default:
      console.log(`🤷 Unhandled event type: ${event.type}`);
  }


  return NextResponse.json({ received: true });
}
