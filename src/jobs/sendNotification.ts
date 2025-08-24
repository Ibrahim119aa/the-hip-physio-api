import { Job } from 'agenda';
import NotificationsModel from '../models/notifications.model';
import UserModel from '../models/user.model';
import { messaging } from '../config/firebase';

// FCM limit: max 500 tokens per sendMulticast
const chunk = <T,>(arr: T[], size = 500) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const defineSendNotificationJob =  (agenda: any) => {
  agenda.define('send-notification', async (job: Job) => {
    const { notificationId } = job.attrs.data as { notificationId: string };
    const notif = await NotificationsModel.findById(notificationId);

    if (!notif || notif.status === 'canceled') return;

    // Fetch recipients
    let users = [];
    
    if (notif.target === 'all') {
      users = await UserModel.find({ 'fcmTokens.0': { $exists: true } }, { fcmTokens: 1 }).lean();
    } else {
      users = await UserModel.find(
        { _id: { $in: notif.userIds }, 'fcmTokens.0': { $exists: true } },
        { fcmTokens: 1 }
      ).lean();
    }

    // Flatten and dedupe tokens
    const tokenSet = new Set<string>();

    for (const u of users) {
      for (const t of (u.fcmTokens || [])) tokenSet.add(t.token);
    }
    
    const tokens = [...tokenSet];

    let success = 0, failure = 0;
    const errorsSample: Array<{code: string, msg: string}> = [];

    const messageBase = {
      notification: { title: notif.title, body: notif.body },
      data: (notif.data || {}) as Record<string,string>,
      android: { priority: 'high' as const },
      apns: { 
        payload: { 
          aps: { sound: 'default' } 
        } 
      },
    };

    for (const batch of chunk(tokens, 500)) {
      const res = await messaging.sendEachForMulticast({ ...messageBase, tokens: batch });
      success += res.successCount;
      failure += res.failureCount;

      // Clean up invalid tokens
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error) {
          const code = r.error.code || 'unknown';
          if (errorsSample.length < 10) errorsSample.push({ code, msg: r.error.message || '' });

          if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
            const bad = batch[idx];
            // pull from all users where present
            UserModel.updateMany(
              { 'fcmTokens.token': bad }, 
              { $pull: { fcmTokens: { token: bad } } }
            ).exec();
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
  });
};

export default defineSendNotificationJob;