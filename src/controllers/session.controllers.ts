import { NextFunction, Request, Response } from "express";
import SessionModel from "../models/session.model";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";
import RehabPlanModel from "../models/rehabPlan.model";

export const createSessionHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {

    const {
      title,
      rehabPlan,
      weekNumber, 
      dayNumber,
      exercises,
    } = req.body;

  
    const session = await SessionModel.create({
      title,
      rehabPlan,
      weekNumber,
      dayNumber,
      exercises,
    });

    // Return created session
    return res.status(201).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('createSessionHandler error :', error);
    next(error)
  }
}

export const getSessionByIdHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      throw new ErrorHandler(400, 'Session ID is required');
    }

    const session = await SessionModel.findById(sessionId)
      .populate({
        path: 'exercises',
        model: 'Exercise'
      })
      .lean();

    if (!session) {
      throw new ErrorHandler(404, 'Session not found');
    }

    res.status(200).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('getSessionByIdHandler error :', error);
    next(error)
  }
}

export const getExerciseBySessionId = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, exerciseId } = req.params;
    console.log(sessionId, exerciseId);
    
    if (!sessionId) {
      throw new ErrorHandler(400, 'Session ID is required');
    }

    if (!exerciseId) {
      throw new ErrorHandler(400, 'Exercise ID is required');
    }

    const session = await SessionModel.findById(sessionId)
      .populate({
        path: 'exercises',
        model: 'Exercise',
        match: { _id: exerciseId } // This will filter exercises to only include the requested one
      })

    if (!session) {
      throw new ErrorHandler(404, 'Session not found');
    }

    // Since we used match in populate, exercises array will contain either 0 or 1 exercise
    if (!session.exercises || session.exercises.length === 0) {
      throw new ErrorHandler(404, 'Exercise not found in this session');
    }

    const exercise = session.exercises[0];

    res.status(200).json({
      success: true,
      data: exercise
    });

  } catch (error) {
    console.error('getExerciseBySessionId error:', error);
    next(error);
  }
}

export const getSessionsForRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      throw new ErrorHandler(400, 'Rehab Plan ID is required');
    }

    const sessions = await SessionModel.find({ rehabPlan: planId })
      .populate({
        path: 'exercises',
        model: 'Exercise'
      });

    res.status(200).json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('getAllSessionsHandler error:', error);
    next(error);
  }
}