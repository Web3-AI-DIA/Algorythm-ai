
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    return getSdks(getApp());
  }

  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  // In a local development environment, connect to the emulators
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Check if emulators are already running for this app
    if (!(auth as any)._emulator) {
      // Point to the emulators running on localhost.
      // Make sure you have the Firebase emulators running!
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      (auth as any)._emulator = true;
    }
    if (!(firestore as any)._emulator) {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      (firestore as any)._emulator = true;
    }
    if (!(storage as any)._emulator) {
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        (storage as any)._emulator = true;
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
