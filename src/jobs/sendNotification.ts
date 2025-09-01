import Agenda, { Job } from 'agenda';
import NotificationsModel from '../models/notifications.model';
import UserModel from '../models/user.model';
import { messaging } from '../config/firebase';

// FCM limit: max 500 tokens per sendMulticast
// const chunk = <T,>(arr: T[], size = 500) => {
//   const out: T[][] = [];
//   for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//   return out;
// };

// const defineSendNotificationJob = (agenda: any) => {
//   agenda.define('send-notification', async (job: Job<any>) => {
//     const { notificationId } = job.attrs.data as { notificationId: string };
//     const notif = await NotificationsModel.findById(notificationId);

//     if (!notif || notif.status === 'canceled') return;

//     // Fetch recipients (with single fcmToken string)
//     let users: Array<{ fcmToken?: string | null }> = [];

//     if (notif.target === 'all') {
//       users = await UserModel.find(
//         { fcmToken: { $ne: null } },
//         { fcmToken: 1 }
//       ).lean<any>();
//     } else {
//       users = await UserModel.find(
//         { _id: { $in: notif.userIds }, fcmToken: { $ne: null } },
//         { fcmToken: 1 }
//       ).lean<any>();
//     }

//     // Flatten and dedupe tokens
//     const tokenSet = new Set<string>();
//     for (const u of users) {
//       if (u.fcmToken) tokenSet.add(u.fcmToken);
//     }
//     const tokens = [...tokenSet];

//     let success = 0,
//       failure = 0;
//     const errorsSample: Array<{ code: string; msg: string }> = [];

//     const messageBase = {
//       notification: { title: notif.title, body: notif.body },
//       data: (notif.data || {}) as Record<string, string>,
//       android: { priority: 'high' as const },
//       apns: {
//         payload: {
//           aps: { sound: 'default' },
//         },
//       },
//     };

//     for (const batch of chunk(tokens, 500)) {
//       const res = await messaging.sendEachForMulticast({
//         ...messageBase,
//         tokens: batch,
//       });
//       success += res.successCount;
//       failure += res.failureCount;

//       // Clean up invalid tokens
//       res.responses.forEach((r, idx) => {
//         if (!r.success && r.error) {
//           const code = r.error.code || 'unknown';
//           if (errorsSample.length < 10)
//             errorsSample.push({ code, msg: r.error.message || '' });

//           if (
//             code === 'messaging/registration-token-not-registered' ||
//             code === 'messaging/invalid-registration-token'
//           ) {
//             const bad = batch[idx];
//             // Unset single token for any users with this token
//             UserModel.updateMany(
//               { fcmToken: bad },
//               { $unset: { fcmToken: '' } }
//             ).exec();
//           }
//         }
//       });
//     }

//     notif.set({
//       sentAt: new Date(),
//       status: failure > 0 && success === 0 ? 'failed' : 'sent',
//       counts: { success, failure },
//       errorsSample,
//     });

//     await notif.save();
//   });
// };



/**
 * Utility: chunk an array into arrays of size `size` (default 500 for FCM)
 */
const chunk = <T,>(arr: T[], size = 500): T[][] => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/**
 * Convert arbitrary data object to Record<string, string> for FCM's data payload.
 * Non-string values are stringified.
 */
const toStringRecord = (obj: unknown): Record<string, string> => {
  const result: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  return result;
};

/**
 * Define the Agenda job that sends notifications.
 * Call this once at server boot with your Agenda instance.
 */
export const defineSendNotificationJob = (agenda: Agenda) => {
  agenda.define('send-notification', async (job: Job) => {
    const { notificationId } = (job.attrs.data || {}) as { notificationId?: string };
    if (!notificationId) return;

    // Load the notification document
    const notif = await NotificationsModel.findById(notificationId);
    if (!notif) return; // deleted or not found

    // Skip if canceled
    if (notif.status === 'canceled') return;

    // Fetch audience
    type U = { fcmToken?: string | null };
    let users: U[] = [];

    if (notif.audienceType === 'all') {
      users = await UserModel.find(
        { fcmToken: { $ne: null } },
        { fcmToken: 1 }
      ).lean<U[]>();
    } else {
      // 'selected'
      users = await UserModel.find(
        { _id: { $in: notif.userIds }, fcmToken: { $ne: null } },
        { fcmToken: 1 }
      ).lean<U[]>();
    }

    // Dedupe tokens
    const tokenSet = new Set<string>();
    for (const u of users) {
      if (u?.fcmToken) tokenSet.add(u.fcmToken);
    }
    const tokens = [...tokenSet];

    // If no tokens, mark as failed with a helpful sample
    if (tokens.length === 0) {
      notif.set({
        sentAt: new Date(),
        status: 'failed',
        counts: { success: 0, failure: 0 },
        errorsSample: [{ code: 'no-tokens', msg: 'No valid FCM tokens for the selected audience.' }],
      });
      await notif.save();
      return;
    }

    // Build a base message (web + android + iOS)
    const messageBase = {
      notification: {
        title: notif.title,
        body: notif.body,
      },
      data: toStringRecord(notif.data), // ensure string map
      webpush: {
        notification: {
          title: notif.title,
          body: notif.body,
          // icon: '/icon-192.png', // optional; make sure the path is valid if you enable
        },
        // Where to open on click (adjust for your app)
        fcmOptions: { link: '/' },
      },
      android: { priority: 'high' as const },
      apns: { payload: { aps: { sound: 'default' } } },
    };

    let success = 0;
    let failure = 0;
    const errorsSample: Array<{ code: string; msg: string }> = [];

    try {
      for (const batch of chunk(tokens, 500)) {
        const res = await messaging.sendEachForMulticast({
          ...messageBase,
          tokens: batch,
        });

        success += res.successCount;
        failure += res.failureCount;

        // Handle per-token errors: collect sample and clean invalid tokens
        res.responses.forEach((r, idx) => {
          if (!r.success && r.error) {
            const code = r.error.code || 'unknown';
            if (errorsSample.length < 10) {
              errorsSample.push({ code, msg: r.error.message || '' });
            }

            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              const bad = batch[idx];
              // Clean the bad token from any users holding it
              // Fire-and-forget is okay here
              UserModel.updateMany({ fcmToken: bad }, { $unset: { fcmToken: '' } }).exec();
            }
          }
        });
      }

      notif.set({
        sentAt: new Date(),
        status: failure > 0 && success === 0 ? 'failed' : 'sent',
        counts: { success, failure },
        errorsSample,
      });
      await notif.save();
    } catch (err: any) {
      // Catastrophic failure (e.g., credentials/network)
      if (errorsSample.length < 10) {
        errorsSample.push({
          code: err?.code || 'send-multicast-error',
          msg: err?.message || 'Unknown error during multicast send',
        });
      }
      notif.set({
        sentAt: new Date(),
        status: 'failed',
        counts: { success, failure },
        errorsSample,
      });
      await notif.save();
    }
  });
};

export default defineSendNotificationJob;
