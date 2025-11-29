import * as admin from 'firebase-admin';

// Check if the service account details are available and not placeholders
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

const hasValidCreds = projectId && clientEmail && privateKey && privateKey !== 'REPLACE_ME';

if (!admin.apps.length && hasValidCreds) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Ensure adminDb is exported, but it will be a no-op if initialization is skipped
export const adminDb = admin.apps.length ? admin.firestore() : null;
