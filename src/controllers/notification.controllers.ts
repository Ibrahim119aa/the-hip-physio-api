import { Request, Response, NextFunction } from 'express';
import NotificationModel from '../models/notifications.model';
import ErrorHandler from '../utils/errorHandlerClass';
import { agenda } from '../jobs/agenda';
import { auth, messaging } from '../config/firebase';
import NotificationsModel from '../models/notifications.model';
// import { INotification } from '../types/notification.types';
// import { sendFcmNotification } from '../utils/send';


// export const createAndScheduleNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {

//     const { title, body, data, target, userIds, scheduleAt } = req.body

//     if (!title || !body || !target) throw new ErrorHandler(400, 'Missing fields')
    
//     if (target === 'selected' && (!userIds || userIds.length === 0)){
//       throw new ErrorHandler(400, 'userIds required for selected target');
//     }

//     const notif = await NotificationModel.create({
//       title, 
//       body, 
//       data: data || {}, 
//       target,
//       userIds: target === 'selected' ? userIds : [],
//       scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
//       status: scheduleAt ? 'scheduled' : 'queued',
//     });

//     if (scheduleAt) {
//       await agenda.schedule(
//         new Date(scheduleAt), 
//         'send-notification', 
//         { notificationId: notif._id.toString() }
//       );
//     } else {
//       await agenda.now(
//         'send-notification', 
//         { notificationId: notif._id.toString() }
//       );
//     }

//     res.json({
//       success: true, 
//       message: scheduleAt ? 'Notification scheduled' : 'Notification queued for sending',
//       notificationId: notif._id 
//     });

//   } catch (error) {
//     console.error('Error in createAndSheduleNotification:', error);
//     next(error);    
//   }
// }

// // controllers/notifications.controller.ts
// export const createAndScheduleNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { title, body, data, audienceType, userIds, scheduleAt } = req.body;

//     if (!title || !body || !audienceType) throw new ErrorHandler(400, 'Missing fields');

//     if (audienceType === 'selected' && (!userIds || userIds.length === 0)) {
//       throw new ErrorHandler(400, 'userIds required for selected audience');
//     }

//     const notif = await NotificationModel.create({
//       title,
//       body,
//       data: data || {},
//       audienceType,
//       userIds: audienceType === 'selected' ? userIds : [],
//       scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
//       status: scheduleAt ? 'scheduled' : 'queued',
//     });

//     if (scheduleAt) {
//       await agenda.schedule(new Date(scheduleAt), 'send-notification', { notificationId: notif._id.toString() });
//     } else {
//       await agenda.now('send-notification', { notificationId: notif._id.toString() });
//     }

//     res.json({
//       success: true,
//       message: scheduleAt ? 'Notification scheduled' : 'Notification queued for sending',
//       notificationId: notif._id
//     });
//   } catch (err) {
//     next(err);
//   }
// };


// // Cancel a scheduled notification (before it runs)
// export const cancelNotificationHandler = async(req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { notificationId } = req.params;

//     const notif = await NotificationModel.findById(notificationId);
//     if (!notif) throw new ErrorHandler(404, 'Notification not found');

//     if (notif.status !== 'scheduled') throw new ErrorHandler(400, 'Notification is not scheduled');

//     await agenda.cancel({ 'data.notificationId': notificationId });

//     notif.status = 'canceled';
//     await notif.save();

//     res.json({ 
//       success: true, 
//       message: 'Notification canceled' 
//     });

//   } catch (error) {
//     console.error('Error in cancelNotification:', error);
//     next(error);
//   }
// }

// export const getNotificationListHandler = async( req: Request,  res: Response,  next: NextFunction ) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const skip = (page - 1) * limit;

//     const notifications = await NotificationModel.find()
//     .sort({ createdAt: -1 }) // Show the latest notifications first
//     .skip(skip)
//     .limit(limit)
//     .lean();
    
//     const total = await NotificationModel.countDocuments();

//     res.status(200).json({
//       success: true,
//       count: notifications.length,
//       pagination: {
//         total,
//         page,
//         pages: Math.ceil(total / limit)
//       },
//       data: notifications
//     });

//   } catch (error) {
//     console.error('Error fetching notifications:', error)
//     next(error);
//   }
// }

// export const fireBaseHealthCheckHandler = async(req: Request, res: Response, next: NextFunction) => {
//   const out: any = { ok: true };

//   // 1) Messaging dry-run (doesn't actually send)
//   try {
//     const id = await messaging.send(
//       { 
//         topic: 'healthcheck', 
//         notification: { title: 'hc', body: 'hc' } 
//       },
//       true // dryRun
//     );

//     out.messaging = { ok: true, messageId: id };
    
//     res.status(200).json({
//       success: true,
//       out
//     });

//   } catch (error: any) {
//     out.ok = false;
//     out.messaging = { ok: false, error: error?.code || error?.message };
//     next(error)
//   }
// }


// // controllers/notifications.controller.ts
// export const testSendToTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { token, title, body, data, link } = req.body;
//     if (!token || !title || !body) throw new ErrorHandler(400, 'token, title, body required');

//     const message = {
//       token,
//       notification: { title, body },
//       data: (data || {}) as Record<string, string>,
//       // Nice for Web receiving & clicking through:
//       webpush: {
//         notification: {
//           title,
//           body,
//           icon: '/icon-192.png',    // optional: serve a small icon
//         },
//         fcmOptions: {
//           link: link || '/',        // where to open on click (web)
//         },
//       },
//       android: { priority: 'high' as const },
//       apns: { payload: { aps: { sound: 'default' } } },
//     };

//     const resp = await messaging.send(message, false); // not dryRun
//     // If the token is invalid, this throws with a helpful code.
//     res.json({ success: true, messageId: resp });
//   } catch (err: any) {
//     res.status(400).json({ success: false, code: err?.code, message: err?.message });
//   }
// };

// export const getNotificationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const notif = await NotificationModel.findById(req.params.id).lean();
//     if (!notif) throw new ErrorHandler(404, 'Notification not found');
//     res.json({ success: true, data: notif });
//   } catch (e) { next(e); }
// };

// src/controllers/notifications.controller.ts
export const createAndScheduleNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, data, audienceType, userIds, scheduleAt } = req.body;

    if (!title || !body || !audienceType) return next(new Error('Missing fields'));

    if (!['all','selected'].includes(audienceType)) return next(new Error('Invalid audienceType'));
    
    if (audienceType === 'selected' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      throw new ErrorHandler(400, 'userIds required for selected audience');
    }

    const when = scheduleAt ? new Date(scheduleAt) : null;
    const status: 'queued'|'scheduled' = when && when.getTime() > Date.now() ? 'scheduled' : 'queued';

    const notif = await NotificationsModel.create({
      title,
      body,
      data: data || {},
      audienceType,
      userIds: audienceType === 'selected' ? userIds : [],
      scheduleAt: status === 'scheduled' ? when : undefined,
      status,
    });

    if (status === 'scheduled') {
      await agenda.schedule(notif.scheduleAt!, 'send-notification', { notificationId: notif._id.toString() });
    } else {
      await agenda.now('send-notification', { notificationId: notif._id.toString() });
    }

    res.json({
      success: true,
      message: status === 'scheduled' ? 'Notification scheduled' : 'Notification queued for sending',
      notificationId: notif._id
    });
  } catch (error) {
    console.error('Error in createAndScheduleNotification:', error)
    next(error); 
  }
};

export const cancelNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notificationId } = req.params;

    const notif = await NotificationsModel.findById(notificationId);
    
    if (!notif) throw new ErrorHandler(404,'Notification not found');
    
    if (notif.status !== 'scheduled') throw new ErrorHandler(400, 'Notification is not scheduled');

    await agenda.cancel({ 'data.notificationId': notificationId });

    notif.status = 'canceled';
    await notif.save();

    res.json({ success: true, message: 'Notification canceled' });
  } catch (error) {
    console.error('Error in cancelNotification:', error); 
    next(error); 
  }
};

export const getNotificationListHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      NotificationsModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationsModel.countDocuments()
    ]);

    res.json({
      success: true,
      count: items.length,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      data: items
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    next(error); 
  }
};

export const getNotificationByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notif = await NotificationsModel.findById(req.params.id).lean();

    if (!notif) throw new ErrorHandler(404, 'Notification not found');
    
    res.json({ 
      success: true, 
      data: notif 
    });
  } catch (error) {
    console.error('Error in getNotificationByIdHandler:', error); 
    next(error); 
  }
};

// one-shot direct test to a token
export const testSendToTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token || !title || !body) {
      throw new ErrorHandler(400, 'token, title, body required');
    }

    const resp = await messaging.send({
      token,
      notification: { title, body },
      data: (data || {}) as Record<string, string>,
      android: { priority: 'high', notification: { channelId: 'high_importance' } },
      apns: {
        headers: { 
          'apns-push-type': 'alert', 
          'apns-priority': '10', 
          ...(process.env.IOS_BUNDLE_ID ? { 'apns-topic': process.env.IOS_BUNDLE_ID } : {}) 
        },
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });

    res.json({ 
      success: true, 
      messageId: resp 
    });
  } catch (error: any) {
    console.error('Error in testSendToTokenHandler:', error);
    next(error);
  }
};

