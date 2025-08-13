import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";
import RehabPlanModel from "../models/rehabPlan.model";

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

export const markSessionCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, sessionId, difficultyRating, userId } = req.body;
    console.log('req.body', req.body);
    
    if (!planId || !sessionId || !userId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }
 
    const progress = await UserProgressModel.findOneAndUpdate(
      { userId, rehabPlanId: planId },
      {
        // $addToSet prevents duplicate entries for the same sessionId
        $addToSet: {
          completedSessions: {
            sessionId: sessionId,
            difficultyRating: difficultyRating
          }
        }
      },
      { new: true, upsert: true } // `upsert: true` creates the doc if it doesn't exist
    );

    res.status(200).json({
      success: true,
      message: 'Session marked as complete.',
      data: progress
    });

  } catch (error) {
    console.error('markSessionCompleteHandler error', error);

    next(error);
  }
};

export const getUserProgressHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, rehabPlanId } = req.params;
    
    if (!userId || !rehabPlanId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }
    
    const progress = await UserProgressModel.findOne({ userId, rehabPlanId });
      
    if(!progress) {
      throw new ErrorHandler(404, 'User progress not found.');
    }

    res.status(200).json({
      success: true,
      message: 'User progress fetched successfully.',
      data: progress
    });
  } catch (error) {
    console.error('getUserProgressHandler error', error);
    
    next(error);
  }
}

export const getUserStreakHanlder = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, rehabPlanId } = req.params;

    if (!userId || !rehabPlanId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }

    const progress = await UserProgressModel.findOne({ userId, rehabPlanId });

    if(!progress) {
      throw new ErrorHandler(404, 'User progress not found.');
    }

    const { completedSessions } = progress;
    let currentStreak = 0;

    if (completedSessions.length > 0) {
      // Sort sessions by date in descending order
      const sortedSessions = completedSessions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Check for streak
      for (let i = 0; i < sortedSessions.length; i++) {
        if (i === 0 || new Date(sortedSessions[i].date).getDate() === new Date(sortedSessions[i - 1].date).getDate() - 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'User streak fetched successfully.',
      data: { currentStreak }
    });
  } catch (error) {
    console.error('getUserStreakHanlder error', error);

    next(error);
  }
}

// export const getUserRehabProgress = async(req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, rehabPlanId } = req.params;

//     if (!userId || !rehabPlanId) {
//       throw new ErrorHandler(400, 'required data is missing.');
//     }

//     const progress = await UserProgressModel.findOne({ userId, rehabPlanId });

//     if(!progress) {
//       throw new ErrorHandler(404, 'User progress not found.');
//     }

//     const { completedSessions } = progress;
//     const { totalSessions } = progress;

//     let percentage = 0;

//     if (totalSessions > 0) {
//       percentage = (completedSessions.length / totalSessions) * 100;
//     }

//     res.status(200).json({
//       success: true,
//       message: 'User rehab progress fetched successfully.',
//       data: { percentage }
//     }); 
//   } catch (error) {
    
//   }
// }

// export const getUserRehabProgressInPercentage = async(req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { userId, rehabPlanId } = req.params;

//     if (!userId || !rehabPlanId) {
//       throw new ErrorHandler(400, 'required data is missing.');
//     }

//     const progress = await UserProgressModel.findOne({ userId, rehabPlanId });

//     if(!progress) {
//       throw new ErrorHandler(404, 'User progress not found.');
//     }

//     // Get completed exercises count
//     const completedExercisesCount = progress.completedExercises.length;

//     // Get total exercises from rehab plan
//     const rehabPlan = await RehabPlanModel.findById(rehabPlanId)
//       .populate({
//         path: 'category',
//         select: 'title description'
//       })
//       .populate({
//         path: 'schedule.sessions',
//         populate: { // Nested population for exercises
//           path: 'exercises',
//           model: 'Exercise'

//         }
//       });
//     console.log('rehabPlan', rehabPlan);
    
//     if(!rehabPlan) {
//       throw new ErrorHandler(404, 'Rehab plan not found.');
//     }

//     const totalExercises = rehabPlan.exercises.length;
//     let percentage = 0;

//     if (totalExercises > 0) {
//       percentage = (completedExercisesCount / totalExercises) * 100;
//     }

//     res.status(200).json({
//       success: true,
//       message: 'User rehab progress fetched successfully.',
//       data: { 
//         percentage,
//         completedExercises: completedExercisesCount,
//         totalExercises
//       }
//     });

//   } catch (error) {
//     console.error('getUserRehabProgressInPercentage error', error);
//     next(error);
//   }
// }