// src/routes/userNotifications.routes.ts
import { Router } from 'express';
import {
  listMyNotifications,
  markNotificationRead,
  markAllRead,
} from '../controllers/userNotifications.controller';
import { isUserAuthenticated } from '../middlewares/isAuthenticated.middleware';

const router = Router();

router.get('/notifications', isUserAuthenticated, listMyNotifications);
router.patch('/notifications/:id/read', isUserAuthenticated, markNotificationRead);
router.patch('/notifications/read-all', isUserAuthenticated, markAllRead);

export default router;
