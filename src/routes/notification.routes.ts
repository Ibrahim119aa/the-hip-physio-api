import { Router } from 'express';
import { cancelNotificationHandler, createAndScheduleNotificationHandler } from '../controllers/notification.controllers';

const router = Router();

router.post('/', createAndScheduleNotificationHandler);
router.post('/cancel/:id', cancelNotificationHandler);

export default router;
