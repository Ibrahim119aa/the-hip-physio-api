import { Router } from "express";
import NotificationModel from "../models/notifications.model";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { cancelNotificationHandler, createAndSheduleNotificationHandler, getNotificationListHandler } from "../controllers/notification.controllers";

const router = Router();


router.route("/")
  .post(isAdminAuthenticated, createAndSheduleNotificationHandler)
  .get(isAdminAuthenticated, getNotificationListHandler);

router.route('/:notificationId/cancel').post(isAdminAuthenticated, cancelNotificationHandler)

export default router;