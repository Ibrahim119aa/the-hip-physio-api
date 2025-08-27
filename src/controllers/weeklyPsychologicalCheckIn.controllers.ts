import { NextFunction, Request, Response } from "express";
import WeeklyPsychologicalCheckInModel from "../models/WeeklyPsychologicalCheckIn.model";
import ErrorHandler from "../utils/errorHandlerClass";

export const createWeeklyPsychologicalCheckIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      rehabPlanId,
      week,
      resilienceScore,
      comments,
    } = req.body;
    const userId = req.userId;
    
    if (!userId || !rehabPlanId || !week || !resilienceScore) {
      throw new ErrorHandler(400, 'Missing required fields' )
    }

    // 3) Create; rely on unique index to prevent duplicates
    const checkIn = await WeeklyPsychologicalCheckInModel.create({
      userId,
      rehabPlanId,
      week,
      resilienceScore,
      comments: typeof comments === "string" ? comments.trim() : undefined,
    });

    res.status(201).json({
      message: 'Weekly psychological check-in submitted successfully',
      data: checkIn
    });

  } catch (error: any) {
    console.error('Error in generateWeeklyPsychologicalCheckIn:', error);
    
    if(error?.code === 11000){
      return next(new ErrorHandler(409, 'Check-in for this week already exists'))
    }
    next(error);
  }
};

export const getWeeklyPsychologicalCheckIn = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { rehabPlanId, week } = req.body;
    console.log(req.body);
    
    if (!rehabPlanId || !week) {
      throw new ErrorHandler(400, 'Missing required fields')
    }

    const checkIn = await WeeklyPsychologicalCheckInModel.findOne({ rehabPlanId, week });
    
    if (!checkIn) {
      throw new ErrorHandler(404, 'Check-in not found')
    }

    res.status(200).json({
      message: 'Weekly psychological check-in fetched successfully',
      data: checkIn
    });

  } catch (error) {
    console.error('Error in getWeeklyPsychologicalCheckIn:', error);
    next(error);
  }
}