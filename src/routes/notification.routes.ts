import { Router } from "express";
import NotificationModel from "../models/notifications.model";
import { isAdminAuthenticated } from "../middlewares/isAuthenticated.middleware";
import { cancelNotificationHandler, createAndScheduleNotificationHandler, fireBaseHealthCheckHandler, getNotificationByIdHandler, getNotificationListHandler, testSendToTokenHandler } from "../controllers/notification.controllers";

const router = Router();


// router.route("/")
//   .post(isAdminAuthenticated, createAndSheduleNotificationHandler)
//   .get(isAdminAuthenticated, getNotificationListHandler);

// router.route('/:notificationId/cancel').post(isAdminAuthenticated, cancelNotificationHandler)
// router.route('/health/firebase').get(fireBaseHealthCheckHandler);

// // testing
// router.route('/test-send').post(testSendToTokenHandler);
// // routes/notification.routes.ts
// router.get('/:id', getNotificationByIdHandler);         // quick details


router.get('/health/firebase', fireBaseHealthCheckHandler);    // GET health check (dry-run)
router.post('/', createAndScheduleNotificationHandler); // POST create + queue/schedule
router.get('/', getNotificationListHandler);          // GET list with pagination
router.get('/:id', getNotificationByIdHandler);       // GET one notification details
router.delete('/:notificationId', cancelNotificationHandler); // DELETE cancel scheduled
router.post('/test-send', testSendToTokenHandler);    // POST send to 1 token right now

export default router;