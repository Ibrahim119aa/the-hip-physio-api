import { Request, Response, NextFunction } from 'express';
import NotificationModel from '../models/notifications.model';
import ErrorHandler from '../utils/errorHandlerClass';
import { agenda } from '../jobs/agenda';
import { auth, messaging } from '../config/firebase';
import NotificationsModel from '../models/notifications.model';

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
    
    const { id } = req.params;

    const notif = await NotificationsModel.findById(id);
    
    if (!notif) throw new ErrorHandler(404,'Notification not found');
    
    if (notif.status !== 'scheduled') throw new ErrorHandler(400, 'Notification is not scheduled');

    await agenda.cancel({ 'data.notificationId': id });

    notif.status = 'canceled';
    await notif.save();

    res.json({ success: true, message: 'Notification canceled' });
  } catch (error) {
    console.error('Error in cancelNotification:', error); 
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

