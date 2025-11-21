import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import { SiweMessage } from 'siwe';
import { v4 as uuidv4 } from 'uuid';

async function getOrCreateUser(address: string) {
  const userDocRef = adminDb!.collection('users').doc(address);
  const userDoc = await userDocRef.get();

  if (userDoc.exists()) {
    return userDoc.data();
  }

  // Create new user if they don't exist
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
  if (!adminDb) {
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

      // Update nonce to prevent replay attacks
      const newNonce = uuidv4();
      const userDocRef = adminDb.collection('users').doc(fields.data.address);
      await userDocRef.update({ nonce: newNonce });

      // Create a custom token for Firebase Authentication
      const customToken = await admin.auth().createCustomToken(fields.data.address);
      
      return NextResponse.json({ token: customToken });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('SIWE Error:', error);
    // Invalidate nonce on error to be safe
    if(message.address) {
        try {
            const newNonce = uuidv4();
            const userDocRef = adminDb.collection('users').doc(message.address);
            await userDocRef.update({ nonce: newNonce });
        } catch (nonceError) {
            console.error("Failed to invalidate nonce:", nonceError);
        }
    }
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
