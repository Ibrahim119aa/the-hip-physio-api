// src/controllers/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { getDashboardAnalyticsService } from '../utils/dashboardAnalytics';


export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const windowDays = req.query.windowDays ? Number(req.query.windowDays) : undefined;
    const irritabilityDays = req.query.irritabilityDays ? Number(req.query.irritabilityDays) : undefined;
    const growthMonths = req.query.growthMonths ? Number(req.query.growthMonths) : undefined;

    const data = await getDashboardAnalyticsService(windowDays, irritabilityDays, growthMonths);

    res.status(200).json({
      success: true,
      message:"Dashboard analytics fetched successfully", 
      data
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    next(error);
  }
};
