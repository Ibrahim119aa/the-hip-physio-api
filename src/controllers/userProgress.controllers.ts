import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";

export const markExerciseCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  console.log('working', req.body)
  try {
    const { planId, exerciseId, irritabilityScore, userId } = req.body;

    if (!planId || !exerciseId || !userId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }
    console.log('req.body', req.body);
    
    const progress = await UserProgressModel.findOneAndUpdate(
      { userId, rehabPlanId: planId },
      {
        // $addToSet prevents duplicate entries for the same exerciseId
        $addToSet: {
          completedExercises: {
            exerciseId: exerciseId,
            irritabilityScore: irritabilityScore // Can be null if not provided
          }
        }
      },
      { new: true, upsert: true } // `upsert: true` creates the doc if it doesn't exist
    );

    res.status(200).json({
      success: true,
      message: 'Exercise marked as complete.',
      data: progress
    });

  } catch (error) {
    console.error('markExerciseCompleteHandler error', error);
    
    next(error);
  }
};