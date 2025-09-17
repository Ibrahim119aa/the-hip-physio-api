import Agenda, { Job } from 'agenda';
import { Types } from 'mongoose';
import NotificationsModel from '../models/notifications.model';
import UserModel from '../models/user.model';
import UserNotificationModel from '../models/userNotification.model';
import { messaging } from '../config/firebase';

const chunk = <T,>(arr: T[], size = 500) => {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const toStringRecord = (obj: unknown): Record<string, string> => {
  const r: Record<string, string> = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      r[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  return r;
};

export const notificationTest = async (notificationId: string) => {
  const notif = await NotificationsModel.findById(notificationId);
  if (!notif) return;

  if (notif.status === 'canceled') return;

  // --- audience fetch (NEED user _id + fcmToken) ---
  type U = { _id: Types.ObjectId; fcmToken?: string | null };
  let users: U[] = [];

  if (notif.audienceType === 'all') {
    users = await UserModel.find(
      { fcmToken: { $ne: null } },
      { _id: 1, fcmToken: 1 }
    ).lean<U[]>();
  } else {
    users = await UserModel.find(
      { _id: { $in: notif.userIds }, fcmToken: { $ne: null } },
      { _id: 1, fcmToken: 1 }
    ).lean<U[]>();
  }

  // Build token set and token -> userId map
  const tokenSet = new Set<string>();
  const tokenToUser = new Map<string, Types.ObjectId>();

  for (const u of users) {
    if (u?.fcmToken) {
      tokenSet.add(u.fcmToken);
      tokenToUser.set(u.fcmToken, u._id);
    }
  }
  const tokens = [...tokenSet];
  console.log("token length is 1");
  if (tokens.length === 0) {
    notif.set({
      sentAt: new Date(),
      status: 'failed',
      counts: { success: 0, failure: 0 },
      errorsSample: [{ code: 'no-tokens', msg: 'No valid FCM tokens for the audience.' }],
    });
    await notif.save();
    return;
  }

  // --- message (Android-focused; APNs kept but harmless on Android) ---
  // const messageBase: any = {
  //   notification: { title: notif.title, body: notif.body },
  //   data: toStringRecord(notif.data),
  //   android: {
  //     priority: 'high',
  //     ttl: 3600 * 1000,
  //     collapseKey: `notif-${notif._id}`,
  //     ...(androidChannelId ? { notification: { channelId: androidChannelId } } : {}),
  //   },
  //   apns: {
  //     headers: {
  //       'apns-push-type': 'alert',
  //       'apns-priority': '10',
  //       // topic can be added later for iOS prod: 'apns-topic': iosTopic
  //       'apns-expiration': `${Math.floor(Date.now() / 1000) + 3600}`,
  //     },
  //     payload: { aps: { sound: 'default', badge: 1 } },
  //   },
  // };
  const messageBase: any = {
    notification: {
      title: notif.title,
      body: notif.body,
    },
    data: toStringRecord(notif.data),
    android: {
      priority: 'high',
      ttl: 3600 * 1000,
      collapseKey: `notif-${notif._id}`,
    },
    apns: {
      headers: {
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': `${Math.floor(Date.now() / 1000) + 3600}`,
      },
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };


  let success = 0, failure = 0;
  const errorsSample: Array<{ code: string; msg: string }> = [];

  try {
    console.log("token length is 0");
    console.log(tokens.length);

    for (const batch of chunk(tokens, 500)) {
      console.log("this is toekn lenghth");
      const res = await messaging.sendEachForMulticast({ ...messageBase, tokens: batch });
      console.log("this is batch");
      console.log(batch);



      console.log("this is success");
      console.log(res);

      success += res.successCount;
      failure += res.failureCount;

      // Prepare inbox upserts per user in this batch
      const ops: any[] = [];

      res.responses.forEach((r, idx) => {
        if (!r.success && r.error) {
          console.error("🔥 FirebaseMessagingError:", {
            index: idx,
            token: batch[idx],
            code: r.error.code,
            message: r.error.message,
            stack: r.error.stack,
          });
        }
        const token = batch[idx];
        const userId = tokenToUser.get(token);
        if (!userId) return;

        const delivered = !!r.success;
        console.log("this is response");
        console.log(r);

        ops.push({
          updateOne: {
            filter: { userId, notificationId: notif._id },
            update: {
              $setOnInsert: {
                userId,
                notificationId: notif._id,
                title: notif.title,
                body: notif.body,
                data: notif.data || {},
                sentAt: new Date(),
                status: 'unread',
              },
              $set: {
                delivered,
                deliveredAt: delivered ? new Date() : null,
              },
            },
            upsert: true,
          },
        });

        // NOTE: intentionally NOT clearing invalid/dead tokens anymore.
        // We still record the error for visibility.
        if (!r.success && r.error) {
          const code = r.error.code || 'unknown';
          if (errorsSample.length < 10) {
            errorsSample.push({ code, msg: r.error.message || '' });
          }
        }
      });

      if (ops.length) {
        await UserNotificationModel.bulkWrite(ops, { ordered: false });
      }
    }

    notif.set({
      sentAt: new Date(),
      status: failure > 0 && success === 0 ? 'failed' : 'sent',
      counts: { success, failure },
      errorsSample,
    });
    await notif.save();
    console.log("this is for send");

  } catch (err: any) {
    if (errorsSample.length < 10) errorsSample.push({ code: err?.code || 'send-error', msg: err?.message || '' });
    notif.set({ sentAt: new Date(), status: 'failed', counts: { success, failure }, errorsSample });
    await notif.save();
  }
}
export const defineSendNotificationJob = async (
  agenda: Agenda,
  opts?: { iosBundleId?: string; androidChannelId?: string }
) => {
  const iosTopic = opts?.iosBundleId;
  const androidChannelId = opts?.androidChannelId; // optional



  agenda.define('send-notification', async (job: Job) => {
    console.log("here");
    const { notificationId } = (job.attrs.data || {}) as { notificationId?: string };

    if (!notificationId) return;


    const notif = await NotificationsModel.findById(notificationId);
    if (!notif) return;

    if (notif.status === 'canceled') return;

    // --- audience fetch (NEED user _id + fcmToken) ---
    type U = { _id: Types.ObjectId; fcmToken?: string | null };
    let users: U[] = [];

    if (notif.audienceType === 'all') {
      users = await UserModel.find(
        { fcmToken: { $ne: null } },
        { _id: 1, fcmToken: 1 }
      ).lean<U[]>();
    } else {
      users = await UserModel.find(
        { _id: { $in: notif.userIds }, fcmToken: { $ne: null } },
        { _id: 1, fcmToken: 1 }
      ).lean<U[]>();
    }

    // Build token set and token -> userId map
    const tokenSet = new Set<string>();
    const tokenToUser = new Map<string, Types.ObjectId>();

    for (const u of users) {
      if (u?.fcmToken) {
        tokenSet.add(u.fcmToken);
        tokenToUser.set(u.fcmToken, u._id);
      }
    }
    const tokens = [...tokenSet];

    if (tokens.length === 0) {
      notif.set({
        sentAt: new Date(),
        status: 'failed',
        counts: { success: 0, failure: 0 },
        errorsSample: [{ code: 'no-tokens', msg: 'No valid FCM tokens for the audience.' }],
      });
      await notif.save();
      return;
    }

    // --- message (Android-focused; APNs kept but harmless on Android) ---
    const messageBase: any = {
      notification: { title: notif.title, body: notif.body },
      data: toStringRecord(notif.data),
      android: {
        priority: 'high',
        ttl: 3600 * 1000,
        collapseKey: `notif-${notif._id}`,
        ...(androidChannelId ? { notification: { channelId: androidChannelId } } : {}),
      },
      apns: {
        headers: {
          'apns-push-type': 'alert',
          'apns-priority': '10',
          // topic can be added later for iOS prod: 'apns-topic': iosTopic
          'apns-expiration': `${Math.floor(Date.now() / 1000) + 3600}`,
        },
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    let success = 0, failure = 0;
    const errorsSample: Array<{ code: string; msg: string }> = [];

    try {
      for (const batch of chunk(tokens, 500)) {
        const res = await messaging.sendEachForMulticast({ ...messageBase, tokens: batch });

        success += res.successCount;
        failure += res.failureCount;

        // Prepare inbox upserts per user in this batch
        const ops: any[] = [];

        res.responses.forEach((r, idx) => {
          const token = batch[idx];
          const userId = tokenToUser.get(token);
          if (!userId) return;

          const delivered = !!r.success;

          ops.push({
            updateOne: {
              filter: { userId, notificationId: notif._id },
              update: {
                $setOnInsert: {
                  userId,
                  notificationId: notif._id,
                  title: notif.title,
                  body: notif.body,
                  data: notif.data || {},
                  sentAt: new Date(),
                  status: 'unread',
                },
                $set: {
                  delivered,
                  deliveredAt: delivered ? new Date() : null,
                },
              },
              upsert: true,
            },
          });

          // NOTE: intentionally NOT clearing invalid/dead tokens anymore.
          // We still record the error for visibility.
          if (!r.success && r.error) {
            const code = r.error.code || 'unknown';
            if (errorsSample.length < 10) {
              errorsSample.push({ code, msg: r.error.message || '' });
            }
          }
        });

        if (ops.length) {
          await UserNotificationModel.bulkWrite(ops, { ordered: false });
        }
      }

      notif.set({
        sentAt: new Date(),
        status: failure > 0 && success === 0 ? 'failed' : 'sent',
        counts: { success, failure },
        errorsSample,
      });
      await notif.save();

    } catch (err: any) {
      if (errorsSample.length < 10) errorsSample.push({ code: err?.code || 'send-error', msg: err?.message || '' });
      notif.set({ sentAt: new Date(), status: 'failed', counts: { success, failure }, errorsSample });
      await notif.save();
    }
  });
};
