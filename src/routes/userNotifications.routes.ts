// src/routes/userNotifications.routes.ts
import { Router } from 'express';
import {
  listMyNotifications,
  markNotificationRead,
  markAllRead,
} from '../controllers/userNotifications.controller';
import { isUserAuthenticated } from '../middlewares/isAuthenticated.middleware';

const router = Router();

router.route('/notifications').get(isUserAuthenticated, listMyNotifications);
router.route('/notifications/:id/read').patch(isUserAuthenticated, markNotificationRead);
router.route('/notifications/read-all').patch(isUserAuthenticated, markAllRead);

export default router;
