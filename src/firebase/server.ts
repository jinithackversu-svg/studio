
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }

  // Next.js Server Components are picky in how they handle environment variables.
  // We're providing a default value for the project ID and importing the config
  // object to ensure the SDK is initialized correctly.
  const app = initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  });

  return app;
}
