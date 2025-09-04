// src/controllers/userNotifications.controller.ts
import { NextFunction, Request, Response } from 'express';
import UserNotificationModel from '../models/userNotification.model';
import ErrorHandler from '../utils/errorHandlerClass';
import NotificationsModel from '../models/notifications.model';
import agenda from '../jobs/agenda';

export const createNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      body,
      data,                 // optional object
      audienceType,         // 'all' | 'selected'
      userIds,              // array when audienceType === 'selected'
      scheduleAt,           // ISO string or null/undefined
    } = req.body;

    // Normalize schedule time (UTC)
    const scheduleDate = scheduleAt ? new Date(scheduleAt) : null;
    const isFuture = !!(scheduleDate && scheduleDate.getTime() > Date.now());

    const notif = await NotificationsModel.create({
      title,
      body,
      data: data || {},
      audienceType,
      userIds: audienceType === 'selected' ? (userIds || []) : [],
      scheduleAt: scheduleDate,
      status: isFuture ? 'scheduled' : 'pending',
    });

    const payload = { notificationId: String(notif._id) };

    if (isFuture) {
      await agenda
        .create('send-notification', payload)
        .unique({ 'data.notificationId': payload.notificationId }) // avoid dup jobs
        .schedule(scheduleDate!)
        .save();
    } else {
      await agenda.now('send-notification', payload);
    }

    res.json({
      success: true,
      notificationId: notif._id,
      status: notif.status,
      scheduleAt: notif.scheduleAt,
    });
  } catch (err) {
    next(err);
  }
};



export const listMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    
     const [items, unread]  = await Promise.all([
      UserNotificationModel.find({ userId }).sort({ createdAt: -1 }).lean(),
      UserNotificationModel.countDocuments({ userId, status: 'unread' }),
    ]);
  
    res.json({
      success: true,
      unreadCount: unread,
      data: items
    });
    
  } catch (error) {
    console.error('Error listing notifications:', error);
    next(error); 
  }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const result = await UserNotificationModel.updateOne(
      { _id: id, userId },
      { $set: { status: 'read', readAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      throw new ErrorHandler(404, 'Notification not found');
    }
    
    res.json({ 
      success: true,
      message: 'Notification marked as read',
      modified: result.modifiedCount > 0 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    next(error);
  }
};


export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).userId;
  try {
    const result = await UserNotificationModel.updateMany(
      { userId, status: 'unread' },
      { $set: { status: 'read', readAt: new Date() } }
    );

    if( result.matchedCount === 0) throw new ErrorHandler(404, 'No unread notifications found');

    res.json({ 
      success: true, 
      modified: result.modifiedCount 
    });
    
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    next(error);
    
  }
};

export const rescheduleNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scheduleAt } = req.body; // new ISO datetime (UTC)

    const scheduleDate = new Date(scheduleAt);
    const isFuture = scheduleDate.getTime() > Date.now();

    // Update DB state
    const notif = await NotificationsModel.findByIdAndUpdate(
      id,
      { scheduleAt: scheduleDate, status: isFuture ? 'scheduled' : 'pending' },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Cancel any existing job for this notification id
    await agenda.cancel({ name: 'send-notification', 'data.notificationId': String(notif._id) });

    // Re-enqueue
    const payload = { notificationId: String(notif._id) };
    if (isFuture) {
      await agenda
        .create('send-notification', payload)
        .unique({ 'data.notificationId': payload.notificationId })
        .schedule(scheduleDate)
        .save();
    } else {
      await agenda.now('send-notification', payload);
    }

    res.json({
      success: true,
      notificationId: notif._id,
      status: notif.status,
      scheduleAt: notif.scheduleAt,
    });
  } catch (err) {
    next(err);
  }
};