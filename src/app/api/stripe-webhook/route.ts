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
  // These will be populated from environment variables if they exist
  [process.env.STRIPE_STARTER_PRICE_ID!]: 40,
  [process.env.STRIPE_PRO_PRICE_ID!]: 100,
  [process.env.STRIPE_SCALE_PRICE_ID!]: 250,
};

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

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const userId = session.client_reference_id;
    if (!userId) {
      console.error('❌ Missing userId in Stripe session client_reference_id');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    try {
       // Retrieve the session with line items
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        session.id,
        { expand: ['line_items'] }
      );
      
      const lineItems = sessionWithLineItems.line_items;
      if (!lineItems?.data.length) {
         console.error('❌ No line items found in session');
         return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }

      // Assuming one-time purchase of a single item
      const priceId = lineItems.data[0].price?.id;
      const creditsToAdd = priceId ? creditsPerPrice[priceId] : 0;

      if (creditsToAdd > 0) {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({
          credits: FieldValue.increment(creditsToAdd)
        });
        console.log(`✅ Successfully added ${creditsToAdd} credits to user ${userId}`);
      } else {
        console.warn(`🤷 No credits configured for priceId: ${priceId}`);
      }

    } catch (error: any) {
      console.error(`🔥 Firestore or Stripe API error: ${error.message}`);
      return NextResponse.json({ error: 'Internal server error while updating user credits.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
