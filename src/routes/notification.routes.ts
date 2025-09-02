// import { Router } from "express";
// import NotificationModel from "../models/notifications.model";
// import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
// import { cancelNotificationHandler, createAndScheduleNotificationHandler, fireBaseHealthCheckHandler, getNotificationByIdHandler, getNotificationListHandler, testSendToTokenHandler } from "../controllers/notification.controllers";

// const router = Router();

// router.route('/health/firebase').get(fireBaseHealthCheckHandler);    // GET health check (dry-run)
// router.route('/')
//   .post(createAndScheduleNotificationHandler) // POST create + queue/schedule
//   .get(getNotificationListHandler)
// router.route('/:id').get(getNotificationByIdHandler);       // GET one notification details
// router.route('/:notificationId').delete(cancelNotificationHandler); // DELETE cancel scheduled
// router.route('/test-send').post(testSendToTokenHandler);    // POST send to 1 token right now

// export default router;

// src/routes/notifications.routes.ts
import { Router } from 'express';
import { cancelNotificationHandler, createAndScheduleNotificationHandler, getNotificationByIdHandler, getNotificationListHandler, testSendToTokenHandler } from '../controllers/notification.controllers';

const router = Router();

router.post('/', createAndScheduleNotificationHandler);
router.get('/', getNotificationListHandler);
router.post('/test-token', testSendToTokenHandler);
router.post('/:notificationId/cancel', cancelNotificationHandler);
router.get('/:id', getNotificationByIdHandler);

export default router;
