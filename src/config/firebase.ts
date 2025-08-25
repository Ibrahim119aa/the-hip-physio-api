import admin from 'firebase-admin';
import config from './config';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey,
    }),
  });
}

export const messaging = admin.messaging();
export const auth = admin.auth();
