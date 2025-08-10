import { NextFunction, Request, Response } from "express";
import SessionModel from "../models/session.model";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";

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

export const markSessionCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, sessionId, difficultyRating } = req.body;
    const userId = req.user.id;

    // 1. Find the session template to know which exercises are required
    const sessionTemplate = await SessionModel.findById(sessionId).lean();
    if (!sessionTemplate) {
      throw new ErrorHandler(404, 'Session not found.');
    }
    const requiredExerciseIds = sessionTemplate.exercises.map(id => id.toString());

    // 2. Find the user's progress document
    const userProgress = await UserProgressModel.findOne({ userId, rehabPlanId: planId });
    if (!userProgress) {
      throw new ErrorHandler(404, 'User progress not found. Please complete an exercise first.');
    }

    // 3. VALIDATION: Check if all exercises in this session are marked complete
    const completedExerciseIds = new Set(userProgress.completedExercises.map(e => e.exerciseId.toString()));
    const allExercisesCompleted = requiredExerciseIds.every(id => completedExerciseIds.has(id));

    if (!allExercisesCompleted) {
        throw new ErrorHandler(400, 'Please complete all exercises in this session before marking it as complete.');
    }

    // 4. Update the session as complete
    userProgress.completedSessions.addToSet({ sessionId, difficultyRating });

    // 5. LOGIC: Unlock the next day or week
    const planTemplate = await RehabPlanModel.findById(planId).lean();
    const totalDaysInWeek = Math.max(...planTemplate.schedule.filter(s => s.week === userProgress.currentWeek).map(s => s.day));
    
    if (userProgress.currentDay < totalDaysInWeek) {
        // Move to next day
        userProgress.currentDay += 1;
    } else {
        // Move to next week
        userProgress.currentWeek += 1;
        userProgress.currentDay = 1; // Reset to Day 1 of the new week
    }

    await userProgress.save();

    res.status(200).json({
        success: true,
        message: `Session complete! Day ${userProgress.currentDay} of Week ${userProgress.currentWeek} is now unlocked.`,
        data: {
            currentWeek: userProgress.currentWeek,
            currentDay: userProgress.currentDay
        }
    });

  } catch (error) {
      next(error);
  }
};