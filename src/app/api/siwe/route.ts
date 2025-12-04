import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/firebase/admin';
import { SiweMessage } from 'siwe';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use getAdminDb/getAdminAuth at request time.
 */

async function getOrCreateUser(address: string) {
  const adminDb = getAdminDb();
  const userDocRef = adminDb.collection('users').doc(address);
  const userDoc = await userDocRef.get();

  if (userDoc.exists()) {
    return userDoc.data();
  }

  const newUser = {
    id: address,
    credits: 5,
    freeAudits: 5,
    isAdmin: false,
    nonce: uuidv4(),
  };
  await userDocRef.set(newUser);
  return newUser;
}

export async function POST(req: NextRequest) {
  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();

  if (!adminDb || !adminAuth) {
    return NextResponse.json({ error: 'Admin SDK not initialized' }, { status: 500 });
  }

  const { message, signature } = await req.json();
  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'nonce') {
      const { address } = message;
      const user = await getOrCreateUser(address);
      return NextResponse.json({ nonce: user!.nonce });
    }

    if (action === 'verify') {
      const siweMessage = new SiweMessage(message);
      const fields = await siweMessage.verify({ signature });

      const newNonce = uuidv4();
      const userDocRef = adminDb.collection('users').doc(fields.data.address);
      await userDocRef.update({ nonce: newNonce });

      // Create a custom token for Firebase Authentication
      const customToken = await adminAuth.createCustomToken(fields.data.address);

      return NextResponse.json({ token: customToken });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('SIWE Error:', error);
    if (message?.address) {
      try {
        const newNonce = uuidv4();
        const userDocRef = adminDb.collection('users').doc(message.address);
        await userDocRef.update({ nonce: newNonce });
      } catch (nonceError) {
        console.error('Failed to invalidate nonce:', nonceError);
      }
    }
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
    }
