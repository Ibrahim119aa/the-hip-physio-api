import { NextFunction, Request, Response } from "express";
import SessionModel from "../models/session.model";
import ErrorHandler from "../utils/errorHandlerClass";

export const createSessionHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    // console.log('session create', req.body);
    
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