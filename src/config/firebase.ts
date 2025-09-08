import admin from 'firebase-admin';
import config from './config';

// Some env providers wrap the key in quotes; normalize + fix \n
const pk = (config.firebasePrivateKey || '')
  .replace(/\\n/g, '\n')
  .replace(/^"|"$/g, '');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId!,
      clientEmail: config.firebaseClientEmail!,
      privateKey: pk,
    }),
  });
}

export const messaging = admin.messaging();
export const auth = admin.auth();
export default admin;
