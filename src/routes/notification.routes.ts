import { Router } from "express";
import NotificationModel from "../models/notifications.model";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { cancelNotificationHandler, createAndScheduleNotificationHandler, fireBaseHealthCheckHandler, getNotificationByIdHandler, getNotificationListHandler, testSendToTokenHandler } from "../controllers/notification.controllers";

const router = Router();

router.route('/health/firebase').get(fireBaseHealthCheckHandler);    // GET health check (dry-run)
router.route('/')
  .post(createAndScheduleNotificationHandler) // POST create + queue/schedule
  .get(getNotificationListHandler)
router.route('/:id').get(getNotificationByIdHandler);       // GET one notification details
router.route('/:notificationId').delete(cancelNotificationHandler); // DELETE cancel scheduled
router.route('/test-send').post(testSendToTokenHandler);    // POST send to 1 token right now

export default router;