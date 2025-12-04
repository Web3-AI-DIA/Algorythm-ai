import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAdminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

/**
 * Read the IPN secret at request time.
 */
function getIpnSecret(): string | null {
  const ipnSecretKey = process.env.NOWPAYMENTS_IPN_SECRET_KEY as string | undefined;
  if (!ipnSecretKey || ipnSecretKey === '<REPLACE_ME_WITH_YOUR_KEY>') return null;
  return ipnSecretKey;
}

const creditsPerAmount: { [key: string]: number } = {
  '25.00000000': 40,
  '50.00000000': 100,
  '100.00000000': 250,
};

export async function POST(req: NextRequest) {
  const ipnSecretKey = getIpnSecret();
  if (!ipnSecretKey) {
    console.warn('NOWPayments IPN processing is disabled. Missing secret key.');
    return NextResponse.json({ message: 'NOWPayments IPN is not configured.' }, { status: 503 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('Firestore Admin SDK not initialized. Cannot process IPN.');
    return NextResponse.json({ error: 'Firestore Admin is not configured.' }, { status: 500 });
  }

  const nowPaymentsSignature = headers().get('x-nowpayments-sig');
  const body = await req.json();

  try {
    // Verify the signature
    const hmac = crypto.createHmac('sha512', ipnSecretKey);
    hmac.update(JSON.stringify(body, Object.keys(body).sort()));
    const signature = hmac.digest('hex');

    if (signature !== nowPaymentsSignature) {
      console.error('NOWPayments IPN Error: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
    }

    // Process the payment status
    const { payment_status, order_id, price_amount } = body;

    if (payment_status === 'finished') {
      const userId = order_id; // We use order_id to store the Firebase User ID
      if (!userId) {
        console.error('❌ Missing userId in NOWPayments order_id');
        return NextResponse.json({ error: 'Missing userId (order_id)' }, { status: 400 });
      }

      const amountKey = Number(price_amount).toFixed(8);
      const creditsToAdd = creditsPerAmount[amountKey] || 0;

      if (creditsToAdd > 0) {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ credits: FieldValue.increment(creditsToAdd) });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`🔥 NOWPayments IPN processing error: ${error?.message}`);
    return NextResponse.json({ error: 'Internal server error while processing IPN.' }, { status: 500 });
  }
}
