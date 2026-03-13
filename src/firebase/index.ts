import { app, db, auth } from './config';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

// Export hooks and providers
export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

type FirebaseServices = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

export function initializeFirebase(): FirebaseServices {
  return {
    firebaseApp: app,
    firestore: db,
    auth: auth,
  };
}
