import { Request, Response, NextFunction } from 'express';

import { INotification } from '../types/notification.types';
import NotificationModel from '../models/notifications.model';
import { sendFcmNotification } from '../utils/send';
import ErrorHandler from '../utils/errorHandlerClass';
import { agenda } from '../jobs/agenda';


export const createAndSheduleNotificationHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const { title, body, data, target, userIds, scheduleAt } = req.body

    if (!title || !body || !target) throw new ErrorHandler(400, 'Missing fields')
    
    if (target === 'selected' && (!userIds || userIds.length === 0)) throw new ErrorHandler(400, 'userIds required for selected target');

    const notif = await NotificationModel.create({
      title, 
      body, 
      data: data || {}, 
      target,
      userIds: target === 'selected' ? userIds : [],
      scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
      status: scheduleAt ? 'scheduled' : 'queued',
    });

    if (scheduleAt) {
      await agenda.schedule(
        new Date(scheduleAt), 
        'send-notification', 
        { notificationId: notif._id.toString() }
      );
    } else {
      await agenda.now(
        'send-notification', 
        { notificationId: notif._id.toString() }
      );
    }

    res.json({
      success: true, 
      message: scheduleAt ? 'Notification scheduled' : 'Notification queued for sending',
      notificationId: notif._id 
    });

  } catch (error) {
    console.error('Error in createAndSheduleNotification:', error);
    next(error);    
  }
}

// Cancel a scheduled notification (before it runs)
export const cancelNotificationHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { notificationId } = req.params;

    const notif = await NotificationModel.findById(notificationId);
    if (!notif) throw new ErrorHandler(404, 'Notification not found');

    if (notif.status !== 'scheduled') throw new ErrorHandler(400, 'Notification is not scheduled');

    await agenda.cancel({ 'data.notificationId': notificationId });

    notif.status = 'canceled';
    await notif.save();

    res.json({ 
      success: true, 
      message: 'Notification canceled' 
    });

  } catch (error) {
    console.error('Error in cancelNotification:', error);
    next(error);
  }
}

export const getNotificationListHandler = async( req: Request,  res: Response,  next: NextFunction ) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const notifications = await NotificationModel.find()
    .sort({ createdAt: -1 }) // Show the latest notifications first
    .skip(skip)
    .limit(limit)
    .lean();
    
    const total = await NotificationModel.countDocuments();

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching notifications:', error)
    next(error);
  }
}

/**
 * @desc    Create and send a notification immediately or schedule it.
 * @route   POST /api/notifications/send
 * @access  Private (Admin)
 */
export const createAndSendNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, body, targetGroup, targetSegment, recipients, data, scheduledTime } = req.body;

        // Basic validation
        if (!title || !body || !targetGroup) {
            res.status(400).json({ success: false, message: 'Title, body, and targetGroup are required.' });
            return;
        }

        const notificationData: Partial<INotification> = {
            title,
            body,
            targetGroup,
            targetSegment,
            recipients,
            data,
        };

        // If scheduledTime is provided, schedule the notification for later
        if (scheduledTime) {
            const scheduleDate = new Date(scheduledTime);
            if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
                res.status(400).json({ success: false, message: 'Invalid scheduled time. Must be a future date.' });
                return;
            }
            
            notificationData.scheduledTime = scheduleDate;
            notificationData.status = 'Scheduled';

            const scheduledNotification = await NotificationModel.create(notificationData);

            res.status(201).json({
                success: true,
                message: 'Notification scheduled successfully.',
                data: scheduledNotification
            });
            return;
        }

        // If no scheduledTime, send immediately
        // In a real app, you would get FCM tokens based on the targetGroup
        const fcmTokens: string[] = []; // Placeholder: Replace with logic to get user FCM tokens

        // This is where you would implement logic to get tokens based on:
        // targetGroup: 'All' -> Get all user tokens
        // targetGroup: 'Segment' -> Get tokens for users in targetSegment
        // targetGroup: 'SelectedUsers' -> Get tokens for users in recipients array

        if (fcmTokens.length === 0 && targetGroup !== 'All') {
             console.warn(`No FCM tokens found for the selected group: ${targetGroup}`);
             // Depending on requirements, you might want to stop here or proceed
        }

        // Call the FCM service to send the push notification
        const fcmResponse = await sendFcmNotification(fcmTokens, title, body, data);

        notificationData.status = 'Sent';
        notificationData.sentTime = new Date();
        
        const sentNotification = await NotificationModel.create(notificationData);

        res.status(201).json({ 
            success: true, 
            message: 'Notification sent successfully.',
            data: sentNotification,
            fcmInfo: fcmResponse // Information from the FCM service
        });

    } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ success: false, message: 'Server error while sending notification.' });
    }
};


/**
 * @desc    Get all notifications with pagination
 * @route   GET /api/notifications
 * @access  Private (Admin)
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const notifications = await NotificationModel.find()
            .sort({ createdAt: -1 }) // Show the latest notifications first
            .skip(skip)
            .limit(limit);
        
        const total = await NotificationModel.countDocuments();

        res.status(200).json({
            success: true,
            count: notifications.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching notifications.' });
    }
};

/**
 * @desc    Get a single notification by its ID
 * @route   GET /api/notifications/:id
 * @access  Private (Admin)
 */
export const getNotificationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const notification = await NotificationModel.findById(req.params.id);

        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found.' });
            return;
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error('Error fetching notification by ID:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


/**
 * @desc    Cancel a scheduled notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (Admin)
 */
export const cancelScheduledNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const notification = await NotificationModel.findById(req.params.id);

        if (!notification) {
            res.status(404).json({ success: false, message: 'Notification not found.' });
            return;
        }

        if (notification.status !== 'Scheduled') {
            res.status(400).json({ success: false, message: `Cannot cancel notification with status: ${notification.status}` });
            return;
        }

        await notification.deleteOne();

        res.status(200).json({ success: true, message: 'Scheduled notification has been canceled.' });
    } catch (error) {
        console.error('Error canceling notification:', error);
        res.status(500).json({ success: false, message: 'Server error while canceling notification.' });
    }
};
 