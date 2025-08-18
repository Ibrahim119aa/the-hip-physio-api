import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";
import RehabPlanModel from "../models/rehabPlan.model";
import mongoose from "mongoose";

// @route  POST /api/user-progress/exercise/completed
export const markExerciseCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, exerciseId, irritabilityScore } = req.body;
    const userId = req.userId;

    if (!planId || !exerciseId || !userId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }
    
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

// @route  POST /api/user-progress/session/completed
export const markSessionCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, sessionId, difficultyRating } = req.body;
    const userId = req.userId;
    
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



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Optional: If you have separate Session/Exercise models, import them if needed
// import SessionModel from "../models/session.model";
// import ExerciseModel from "../models/exercise.model";

type ProgressSession = {
  sessionId: string;
  title: string;
  completed: boolean;
  totalExercises: number;
  completedExercises: number;
};

type ProgressDay = {
  day: number;
  unlocked: boolean;
  completed: boolean;
  totalExercises: number;
  completedExercises: number;
  sessions: ProgressSession[];
};

type ProgressWeek = {
  week: number;
  unlocked: boolean;
  completed: boolean;
  days: ProgressDay[];
};

type ProgressStatus = {
  weeks: ProgressWeek[];
  currentWeek: number;
  currentDay: number;
  totals: {
    totalExercises: number;
    completedExercises: number;
    totalSessions: number;
    completedSessions: number;
  };
};

// Helper to stringify ObjectId
const oid = (v: any) => (typeof v === "string" ? v : (v as mongoose.Types.ObjectId).toString());


// @route GET /api/user-progress/user-status/:planId/userId
export const getPlanProgressStatus = async (req: Request, res: Response) => {
  try {
    const { planId, userId } = req.params;
    // const userId = req.userId;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId required" });
    }

    // 1) Pull the plan with schedule -> sessions -> exercises populated
    const plan = await RehabPlanModel.findById(planId)
      .populate({
        path: "schedule.sessions",
        model: "Session",
        populate: {
          path: "exercises",
          model: "Exercise",
          select: "_id name thumbnailUrl sets reps estimatedDuration",
        },
      })

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // 2) Get user progress for this plan
    const progress = await UserProgressModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      rehabPlanId: new mongoose.Types.ObjectId(planId),
    })

    const completedExerciseIds = new Set<string>(
      (progress?.completedExercises || []).map((e: any) => oid(e.exerciseId))
    );
    const completedSessionIds = new Set<string>(
      (progress?.completedSessions || []).map((s: any) => oid(s.sessionId))
    );

    // 3) Build a sorted structure week -> days[]
    const schedule = (plan.schedule || []).slice().sort((a: any, b: any) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.day - b.day;
    });

    // Determine which weeks exist and the days within them
    const weekMap = new Map<number, any[]>();
    for (const item of schedule) {
      const arr = weekMap.get(item.week) || [];
      arr.push(item);
      weekMap.set(item.week, arr);
    }

    // 4) Compute completion / unlocks
    const weeksOut: ProgressWeek[] = [];
    let previousWeekCompleted = true; // week 1 unlocks; will be updated
    let totals = {
      totalExercises: 0,
      completedExercises: 0,
      totalSessions: 0,
      completedSessions: 0,
    };

    const allWeeks = [...weekMap.keys()].sort((a, b) => a - b);
    for (const w of allWeeks) {
      const daysForWeek = weekMap.get(w)!; // sorted by day
      let weekCompleted = true;
      const weekUnlocked = previousWeekCompleted || w === 1;

      const daysOut: ProgressDay[] = [];
      let previousDayCompleted = true; // day 1 unlocks inside an unlocked week

      for (const dayItem of daysForWeek) {
        const sessions = dayItem.sessions || [];

        // Count total and completed per day
        let dayTotalExercises = 0;
        let dayCompletedExercises = 0;

        const sessionsOut: ProgressSession[] = [];
        for (const s of sessions) {
          const sessionId = oid(s._id);
          const exercises = (s.exercises || []) as any[];
          const sTotal = exercises.length;
          const sCompleted =
            sTotal > 0 &&
            exercises.every((ex) => completedExerciseIds.has(oid(ex._id))) ||
            completedSessionIds.has(sessionId);

          const sDoneCount = exercises.reduce((acc, ex) => acc + (completedExerciseIds.has(oid(ex._id)) ? 1 : 0), 0);

          dayTotalExercises += sTotal;
          dayCompletedExercises += sDoneCount;

          totals.totalSessions += 1;
          if (sCompleted) totals.completedSessions += 1;

          sessionsOut.push({
            sessionId,
            title: s.title,
            completed: sCompleted,
            totalExercises: sTotal,
            completedExercises: sDoneCount,
          });
        }

        totals.totalExercises += dayTotalExercises;
        totals.completedExercises += dayCompletedExercises;

        const dayCompleted =
          dayTotalExercises > 0 && dayCompletedExercises === dayTotalExercises;

        // Unlock rule:
        // - Week must be unlocked
        // - Day 1 unlocked if weekUnlocked
        // - Day N>1 unlocked if previous day completed
        const dayUnlocked = weekUnlocked && (dayItem.day === 1 ? true : previousDayCompleted);

        daysOut.push({
          day: dayItem.day,
          unlocked: dayUnlocked,
          completed: dayCompleted,
          totalExercises: dayTotalExercises,
          completedExercises: dayCompletedExercises,
          sessions: sessionsOut,
        });

        previousDayCompleted = dayCompleted;
        if (!dayCompleted) weekCompleted = false;
      }

      weeksOut.push({
        week: w,
        unlocked: weekUnlocked,
        completed: weekCompleted,
        days: daysOut,
      });

      previousWeekCompleted = weekCompleted;
    }

    // 5) Determine current (first unlocked & not completed), else last unlocked
    let currentWeek = allWeeks[0] ?? 1;
    let currentDay = 1;
    let found = false;

    for (const wk of weeksOut) {
      if (!wk.unlocked) break;
      for (const d of wk.days) {
        if (d.unlocked && !d.completed) {
          currentWeek = wk.week;
          currentDay = d.day;
          found = true;
          break;
        }
      }
      if (found) break;
      // if all unlocked days completed, default to last day of this unlocked week
      if (wk.unlocked && wk.days.length) {
        currentWeek = wk.week;
        currentDay = wk.days[wk.days.length - 1].day;
      }
    }

    const payload: ProgressStatus = {
      weeks: weeksOut,
      currentWeek,
      currentDay,
      totals,
    };

    return res.json({
      success: true,
      message: "Progress status computed.",
      data: payload,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

export const getUserLogbookHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, rehabPlanId } = req.params;

    if (!userId || !rehabPlanId) {
      throw new ErrorHandler(400, "Required data is missing.");
    }

    const progress = await UserProgressModel.findOne({ userId, rehabPlanId })
      .populate({
        path: "completedSessions.sessionId",
        model: "Session",
        populate: { path: "exercises", model: "Exercise" }
      })

    if (!progress) {
      throw new ErrorHandler(404, "User progress not found.");
    }

    // Create a date-indexed map of completed sessions
    const logbookMap: Record<string, any> = {};
    progress.completedSessions.forEach((s: any) => {
      const dateKey = new Date(s.completedAt).toISOString().split("T")[0];
      if (!logbookMap[dateKey]) {
        logbookMap[dateKey] = { date: dateKey, status: "completed", sessions: [] };
      }
      logbookMap[dateKey].sessions.push({
        sessionId: s.sessionId._id,
        difficultyRating: s.difficultyRating,
        irritabilityScore: progress.completedExercises.find(
          (e: any) => e.exerciseId && s.sessionId.exercises.some((ex: any) => ex._id.equals(e.exerciseId))
        )?.irritabilityScore || null,
        exercises: s.sessionId.exercises.map((ex: any) => ({
          exerciseId: ex._id,
          name: ex.name
        }))
      });
    });

    // Fill in missed days for the rehab plan duration
    const startDate = new Date(progress.createdAt);
    const today = new Date();
    const logbook = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      if (logbookMap[key]) {
        logbook.push(logbookMap[key]);
      } else {
        logbook.push({ date: key, status: "missed", sessions: [] });
      }
    }

    res.status(200).json({
      success: true,
      message: "Logbook fetched successfully.",
      data: logbook
    });
  } catch (error) {
    console.error("getUserLogbookHandler error", error);
    next(error);
  }
};
