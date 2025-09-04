// src/routes/dashboard.routes.ts
import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/dashboard.controller';

const router = Router();

// GET /api/dashboard/analytics
router.get('/analytics', getDashboardAnalytics);

export default router;
