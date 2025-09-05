import { Router } from 'express';
import { cancelNotificationHandler, createAndScheduleNotificationHandler, getAllNotificationsHandler } from '../controllers/notification.controllers';
import { isAdminAuthenticated } from '../middlewares/isAuthenticated.middleware';
import { hasRole } from '../middlewares/hasRole.middleware';

const router = Router();

router.route("/")
  .post(isAdminAuthenticated, hasRole('admin'), createAndScheduleNotificationHandler)
  .get(isAdminAuthenticated, hasRole('admin'), getAllNotificationsHandler);
router.route('/cancel/:id').post(isAdminAuthenticated, hasRole('admin'), cancelNotificationHandler);

export default router;
