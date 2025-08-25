import { NextFunction, Request, Response } from "express";
import WeeklyPsychologicalCheckInModel from "../models/PsychologicalCheckIn.model";

export const generateWeeklyPsychologicalCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      rehabPlanId,
      week,
      resilienceScore,
      comments,
      exercisesCompleted
    } = req.body;

    if (!userId || !rehabPlanId || !week || !resilienceScore) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prevent duplicate check-ins for the same user, rehab plan, and week
    const existingCheckIn = await WeeklyPsychologicalCheckInModel.findOne({
      userId,
      rehabPlanId,
      week
    });

    if (existingCheckIn) {
      return res.status(409).json({ message: 'Check-in for this week already exists' });
    }

    const checkIn = await WeeklyPsychologicalCheckInModel.create({
      userId,
      rehabPlanId,
      week,
      resilienceScore,
      comments,
      exercisesCompleted
    });

    return res.status(201).json({
      message: 'Weekly psychological check-in submitted successfully',
      data: checkIn
    });

  } catch (error) {
    next(error);
  }
};
