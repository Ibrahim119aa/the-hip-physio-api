import { NextFunction, Request, Response } from "express";
import SessionModel from "../models/session.model";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";
import RehabPlanModel from "../models/rehabPlan.model";
import { CreateSessionSchema, SessionParamsSchema, TCreateSessionRequest, TSessionParams } from "../validationSchemas/session.schema";

export const createSessionHandler = async(
  req: Request<{}, {}, TCreateSessionRequest>, 
  res: Response, 
  next: NextFunction
) => {

  try {
    const parsedBody = CreateSessionSchema.safeParse(req.body);
  
    if (!parsedBody.success) {
      const errorMesssages = parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMesssages);
    } 

    const {
      title,
      rehabPlan,
      weekNumber, 
      dayNumber,
      exercises,
    } = parsedBody.data;

  
    const session = await SessionModel.create({
      title,
      rehabPlan,
      weekNumber,
      dayNumber,
      exercises,
    });
  
    if(!session) throw new ErrorHandler(500, "Failed to create session");

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: session
    });

  } catch (error) {
    console.error('createSessionHandler error :', error);
    next(error)
  }
}

// Add exercises to a session (no duplicates)
export const addExercisesToSessionHandler = async (
  req: Request<TSessionParams, {}, { exerciseIds: string[] }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedParams = SessionParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      const errorMesssages = parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMesssages);
    }

    const { sessionId } = parsedParams.data;
    const { exerciseIds } = req.body;

    if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'exerciseIds required' });
    }

    await SessionModel.updateOne(
      { _id: sessionId },
      {
        $addToSet: {
          exercises: { $each: exerciseIds },
        },
      }
    );

    const updated = await SessionModel.findById(sessionId)
      .select('title weekNumber dayNumber exercises isComplete')
      .populate({
        path: 'exercises',
        model: 'Exercise',
        select:
          'name thumbnailUrl reps sets estimatedDuration videoUrl category bodyPart difficulty tags',
        populate: {
          path: 'category',
          model: 'ExerciseCategory',
          select: 'title',
        },
      });

    res.json({ 
      success: true,
      message: 'Exercises added to session successfully', 
      data: updated 
    });
  } catch (err) {
    next(err);
  }
};

// Remove one exercise from a session
export const removeExerciseFromSessionHandler = async (
  req: Request<{ sessionId: string; exerciseId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, exerciseId } = req.params;

    await SessionModel.updateOne(
      { _id: sessionId },
      { $pull: { exercises: exerciseId } }
    );

    const updated = await SessionModel.findById(sessionId)
      .select('title weekNumber dayNumber exercises isComplete')
      .populate({
        path: 'exercises',
        model: 'Exercise',
        select:
          'name thumbnailUrl reps sets estimatedDuration videoUrl category bodyPart difficulty tags',
        populate: {
          path: 'category',
          model: 'ExerciseCategory',
          select: 'title',
        },
      });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};


export const getExerciseBySessionId = async(
  req: Request<{ sessionId: string; exerciseId: string }>, 
  res: Response, 
  next: NextFunction
) => {
  try {

    const { sessionId, exerciseId } = req.params;
   
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

export const getSessionsForRehabPlanHandler = async(
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
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

    if(!sessions) {
      throw new ErrorHandler(404, 'No sessions found for this rehab plan');
    }

    res.status(200).json({
      success: true,
      data: sessions
    });

  } catch (error) {
    console.error('getAllSessionsHandler error:', error);
    next(error);
  }
}

export const getSessionByIdHandler = async(
  req: Request<TSessionParams, {}, {}>, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const parsedParams = SessionParamsSchema.safeParse(req.params);

    if (!parsedParams.success) {
      const errorMesssages = parsedParams.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMesssages);
    }
    
    const { sessionId } = parsedParams.data;

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