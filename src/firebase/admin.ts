import admin from 'firebase-admin';

let _adminApp: admin.app.App | null = null;

/**
 * Lazily initialize Firebase Admin SDK using environment variables.
 * Avoid reading env values at module load time to prevent secrets from being inlined during build.
 */
function ensureAdminApp() {
  if (_adminApp) return _adminApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  const hasValidCreds = !!projectId && !!clientEmail && !!privateKeyEnv && privateKeyEnv !== 'REPLACE_ME';

  if (!hasValidCreds) {
    // Do not throw here — keep behavior similar to previous code but avoid initializing.
    // Callers should check for null/throw if admin functionality is required.
    return null as unknown as admin.app.App;
  }

  const privateKey = privateKeyEnv!.replace(/\\n/g, '\n');

  const credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  } as admin.ServiceAccount);

  _adminApp = admin.apps[0] ?? admin.initializeApp({ credential });

  return _adminApp;
}

/**
 * Returns the initialized Admin App or throws if not configured.
 */
export function getAdminApp(): admin.app.App {
  const app = ensureAdminApp();
  if (!app) {
    throw new Error(
      'Firebase Admin SDK is not configured. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your environment.'
    );
  }
  return app;
}

export function getAdminDb() {
  return getAdminApp().firestore();
}

export function getAdminAuth() {
  return getAdminApp().auth();
}
