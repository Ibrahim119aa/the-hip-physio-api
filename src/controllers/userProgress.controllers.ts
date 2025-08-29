import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import UserProgressModel from "../models/userProgress.model";
import RehabPlanModel from "../models/rehabPlan.model";
import mongoose from "mongoose";
import { buildCompletionRecord } from "../utils/timezone";
import { DateTime } from "luxon";

// @route  POST /api/user-progress/exercise/completed
// export const markExerciseCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
//   const session = await mongoose.startSession();
//   try {
//     session.startTransaction();
//     console.log(req.body);
    
//     const { planId, exerciseId, sessionId, irritabilityScore } = req.body;
//     const userId = req.userId;

//     if (!planId || !exerciseId || !userId || !sessionId || irritabilityScore === null) {
//       throw new ErrorHandler(400, 'Required data is missing.');
//     }

//     // Check if exercise is already completed
//     const existingExercise = await UserProgressModel.findOne({
//       userId,
//       rehabPlanId: planId,
//       "completedExercises": {
//         $elemMatch: {
//           exerciseId: exerciseId,
//           sessionId: sessionId
//         }
//       }
//     }).session(session);

//     if (existingExercise) throw new ErrorHandler(409, "Exercise was already marked as complete")

//     // Atomically find and update the document.
//     let progress = await UserProgressModel.findOneAndUpdate(
//       {
//         userId,
//         rehabPlanId: planId,
//       },
//       {
//         $push: {
//           completedExercises: {
//             sessionId,
//             exerciseId,
//             irritabilityScore,
//             completedAt: new Date(),
//           },
//         },
//       },
//       { 
//         new: true,
//         session: session 
//       }
//     );
    
//     if (!progress){
//       // create progress
//       const newProgress = new UserProgressModel({
//         userId,
//         rehabPlanId: planId,
//         completedExercises: [{
//           sessionId,
//           exerciseId,
//           irritabilityScore,
//           completedAt: new Date(),
//         }],
//       });
      
//       await newProgress.save({ session });
//       progress = newProgress;
//     }
    
//     // --- PERCENTAGE CALCULATION ---

//     // 1) Load plan to get total number of exercises
//     const plan = await RehabPlanModel.findById(planId)
//       .populate({
//         path: "schedule.sessions",
//         model: "Session",
//         populate: { path: "exercises", model: "Exercise", select: "_id" },
//       })
//       .session(session)
//       .lean<any>();

//     if (!plan) throw new ErrorHandler(404, "Rehab plan associated with this progress not found.");

//     // 2) Calculate total exercises in the plan
//     const totalExercises = (plan.schedule || []).reduce((acc: number, item: any) => {
//       const sessions = item.sessions || [];
//       const exCount = sessions.reduce((sAcc: number, s: any) => sAcc + (s.exercises?.length || 0), 0);
//       return acc + exCount;
//     }, 0);

//     // 3) Get count of newly completed exercises from the updated document
//     const completedCount = progress.completedExercises.length;

//     const percent = totalExercises > 0
//       ? Math.min(100, Math.round((completedCount / totalExercises) * 100))
//       : 0;

//     // 4) Update progress percentage
//     progress.progressPercent = percent;
//     await progress.save({ session });
    
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: 'Exercise marked as complete.',
//       data: progress
//     });

//   } catch (error) {
//     // Rollback any changes made in this session
//     if(session.inTransaction()){
//       await session.abortTransaction();
//     }

//     session.endSession();

//     console.error('markExerciseCompleteHandler error', error);
//     next(error);
//   }
// };

export const markExerciseCompleteHandler = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { planId, exerciseId, sessionId, irritabilityScore, timezone } = req.body;
    const userId = req.userId;

    if (!planId || !exerciseId || !userId || !sessionId || irritabilityScore === null || !timezone) {
      throw new ErrorHandler(400, 'Required data is missing.');
    }

    // Check if exercise already completed (same dayKey could also be used for idempotency if needed)
    const existingExercise = await UserProgressModel.findOne({
      userId,
      rehabPlanId: planId,
      "completedExercises": {
        $elemMatch: {
          exerciseId,
          sessionId
        }
      }
    }).session(session);

    if (existingExercise) {
      throw new ErrorHandler(409, "Exercise was already marked as complete");
    }

    // Generate UTC + local + dayKey info using timezone
    const completedAtUTC = new Date();
    const { completedAtLocal, dayKey } = buildCompletionRecord({ completedAtUTC, timezone });

    const completionData = {
      sessionId,
      exerciseId,
      irritabilityScore,
      completedAtUTC,
      completedAtLocal,
      timezone,
      dayKey
    };

    // Find and update the document atomically
    let progress = await UserProgressModel.findOneAndUpdate(
      { userId, rehabPlanId: planId },
      { $push: { completedExercises: completionData } },
      { new: true, session }
    );

    if (!progress) {
      // If progress doc doesn't exist, create it
      const newProgress = new UserProgressModel({
        userId,
        rehabPlanId: planId,
        completedExercises: [completionData]
      });

      await newProgress.save({ session });
      progress = newProgress;
    }

    // --- PERCENTAGE CALCULATION ---
    const plan = await RehabPlanModel.findById(planId)
      .populate({
        path: "schedule.sessions",
        model: "Session",
        populate: { path: "exercises", model: "Exercise", select: "_id" },
      })
      .session(session)
      .lean<any>();

    if (!plan) throw new ErrorHandler(404, "Rehab plan associated with this progress not found.");

    const totalExercises = (plan.schedule || []).reduce((acc: number, item: any) => {
      const sessions = item.sessions || [];
      return acc + sessions.reduce((sAcc: number, s: any) => sAcc + (s.exercises?.length || 0), 0);
    }, 0);

    const completedCount = progress.completedExercises.length;

    const percent = totalExercises > 0
      ? Math.min(100, Math.round((completedCount / totalExercises) * 100))
      : 0;

    progress.progressPercent = percent;
    await progress.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Exercise marked as complete.',
      data: progress
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('markExerciseCompleteHandler error', error);
    next(error);
  }
};


// export const markSessionCompleteAndStreakCount = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { planId, sessionId, difficultyRating } = req.body;
//     const userId = req.userId;

//     if (!planId || !sessionId || !userId) {
//       throw new ErrorHandler(400, 'Required data is missing.');
//     }

//     // Find user progress
//     let currentProgress = await UserProgressModel.findOne({
//       userId,
//       rehabPlanId: planId
//     });

//     // Check if this session was already completed
//     if (
//         currentProgress && 
//         currentProgress.completedSessions?.some((s: any) => s.sessionId?.toString() === sessionId?.toString())
//       ) {

//       throw new ErrorHandler(409, 'This session has already been marked as completed.');
//     }

//     // First-time user (no progress or no completed sessions)
//     if (!currentProgress || !currentProgress.completedSessions?.length) {
//       const result = await UserProgressModel.findOneAndUpdate(
//         { userId, rehabPlanId: planId },
//         {
//           $addToSet: {
//             completedSessions: {
//               sessionId,
//               difficultyRating,
//               completedAt: new Date()
//             }
//           },
//           $set: {
//             streakCountWeekly: 1,
//             streakCountMonthly: 1
//           }
//         },
//         { new: true, upsert: true }
//       );
      
//       res.status(200).json({
//         success: true,
//         message: 'First session completed and streak initialized.',
//         data: result
//       });

//       return;
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // reset time to midnight (00:00:00.000)

//     // Get last completed session
//     const lastCompletedSession = currentProgress.completedSessions
//       .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];

//     // Normalize the date of the last completed session to midnight
//     const lastCompletedSessionDate = new Date(lastCompletedSession.completedAt);
//     lastCompletedSessionDate.setHours(0, 0, 0, 0); // reset time to midnight (00:00:00.000)

//     // Calculate the time difference between today and the last completed session
//     const timeDifference = today.getTime() - lastCompletedSessionDate.getTime();
//     // Convert time difference from milliseconds to full days
//     const exactDaysDifference = Math.floor(timeDifference / (24 * 60 * 60 * 1000)); // 1 day = 86,400,000 ms

//     // Determine streak logic
//     const isSameDay = exactDaysDifference === 0;
//     const isNextDay = exactDaysDifference === 1;
//     const isStreakLost = exactDaysDifference > 1;

//     // Build update payload
//     let updatePayload: any = {
//       $addToSet: {
//         completedSessions: {
//           sessionId,
//           difficultyRating,
//           completedAt: new Date()
//         }
//       }
//     };

//     // Update streaks based on whether the user continued the streak
//     if (isSameDay || isNextDay) {
//       updatePayload.$inc = {
//         streakCountWeekly: 1,
//         streakCountMonthly: 1
//       };
//     } else if (isStreakLost) {
//       // User broke the streak – reset counts
//       updatePayload.$set = {
//         streakCountWeekly: 1,
//         streakCountMonthly: 1
//       };
//     }

//     // Update the user's progress document
//     const result = await UserProgressModel.findOneAndUpdate(
//       { userId, rehabPlanId: planId },
//       updatePayload,
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: 'Session marked as complete and streak updated.',
//       data: result
//     });

//   } catch (error) {
//     console.error('markSessionCompleteAndStreakCount error', error);
//     next(error);
//   }
// };

export const markSessionCompleteAndStreakCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId, sessionId, difficultyRating, timezone, userNote } = req.body;
    const userId = req.userId;

    if (!planId || !sessionId || !userId || !timezone) {
      throw new ErrorHandler(400, 'Required data is missing.');
    }

    // Generate UTC + local + dayKey info using timezone
    const completedAtUTC = new Date();
    const { completedAtLocal, dayKey } = buildCompletionRecord({ completedAtUTC, timezone });

    // Fetch user progress
    let currentProgress = await UserProgressModel.findOne({ userId, rehabPlanId: planId });

    // Check if session already completed
    if (
      currentProgress &&
      currentProgress.completedSessions?.some((s: any) => s.sessionId?.toString() === sessionId?.toString())
    ) {
      throw new ErrorHandler(409, 'This session has already been marked as completed.');
    }

    const sessionCompletionData = {
      sessionId,
      difficultyRating,
      completedAtUTC,
      completedAtLocal,
      timezone,
      dayKey,
      userNote: userNote && userNote.trim() !== "" 
        ? {
            text: userNote.trim(),
            createdBy: userId,
            createdAt: new Date()
          }
        : null
    };

    // First-time user (or no previous sessions)
    if (!currentProgress || !currentProgress.completedSessions?.length) {
      const result = await UserProgressModel.findOneAndUpdate(
        { userId, rehabPlanId: planId },
        {
          $addToSet: { completedSessions: sessionCompletionData },
          $set: {
            streakCountWeekly: 1,
            streakCountMonthly: 1
          }
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'First session completed and streak initialized.',
        data: result
      });
    }

    // --- STREAK LOGIC WITH TIMEZONE AWARENESS ---

    // Sort by latest dayKey using timezone-aware comparison
    const lastCompletedSession = currentProgress.completedSessions
      .sort((a: any, b: any) => (b.dayKey > a.dayKey ? 1 : -1))[0];

      // const lastDay = DateTime.fromFormat(lastCompletedSession.dayKey, 'yyyy-MM-dd');
      // const currentDay = DateTime.fromFormat(dayKey, 'yyyy-MM-dd');

    // Use DateTime to properly calculate day differences in the user's timezone
    const lastDay = DateTime.fromFormat(lastCompletedSession.dayKey, 'yyyy-MM-dd', { zone: timezone });
    const currentDay = DateTime.fromFormat(dayKey, 'yyyy-MM-dd', { zone: timezone }); 

    const diffInDays = currentDay.diff(lastDay, 'days').days;

    const isSameDay = diffInDays === 0;
    const isNextDay = diffInDays === 1;
    const isStreakLost = diffInDays > 1;

    let updatePayload: any = {
      $addToSet: {
        completedSessions: sessionCompletionData
      }
    };

    if (isSameDay || isNextDay) {
      updatePayload.$inc = {
        streakCountWeekly: 1,
        streakCountMonthly: 1
      };
    } else if (isStreakLost) {
      updatePayload.$set = {
        streakCountWeekly: 1,
        streakCountMonthly: 1
      };
    }

    const result = await UserProgressModel.findOneAndUpdate(
      { userId, rehabPlanId: planId },
      updatePayload,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Session marked as complete and streak updated.',
      data: result
    });

  } catch (error) {
    console.error('markSessionCompleteAndStreakCount error', error);
    next(error);
  }
};

export const getUserProgressHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    // const { userId, rehabPlanId } = req.params;
    const { rehabPlanId } = req.params;
    const userId = req.userId

    if (!userId || !rehabPlanId) {
      throw new ErrorHandler(400, 'required data is missing.');
    }
    
    const progress = await UserProgressModel.findOne({ userId, rehabPlanId }).populate({
      path: "rehabPlanId",
      model: "RehabPlan",
      select: "name"
    });
      
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
  planId: string,
  planName: string
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
      planId: plan._id,
      planName: plan.name,
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


// @route GET /api/user-progress/completed/:planId/:userId

export const getCompletedWithResilience = async (req: Request, res: Response) => {
  try {
    const { planId, userId } = req.params;
    console.log('planId', planId);
    console.log('userId', userId);
    

    // 1) Pull the plan with sessions/exercises (for names & mapping week/day)
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
      .lean<any>();

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // Build maps: sessionId -> {week, day, title, exercises[]}; exerciseId -> {week, day, sessionId, name}
    const sessionMeta = new Map<string, { week: number; day: number; title?: string; exerciseIds: string[] }>();
    const exerciseMeta = new Map<string, { week: number; day: number; sessionId: string; name?: string }>();
    // also collect per (week, day) -> sessionIds/exerciseIds to compute completed days/weeks
    const dayKey = (w: number, d: number) => `${w}#${d}`;
    const dayToSessions = new Map<string, Set<string>>();
    const dayToExercises = new Map<string, Set<string>>();
    const weeksSet = new Set<number>();

    const schedule = (plan.schedule || []).slice().sort((a: any, b: any) =>
      a.week === b.week ? a.day - b.day : a.week - b.week
    );

    for (const item of schedule) {
      const w = item.week;
      const d = item.day;
      weeksSet.add(w);
      const dKey = dayKey(w, d);

      const sSet = dayToSessions.get(dKey) ?? new Set<string>();
      const eSet = dayToExercises.get(dKey) ?? new Set<string>();

      for (const s of item.sessions || []) {
        const sId = oid(s._id);
        const exs = (s.exercises || []) as any[];
        const exIds = exs.map((ex) => oid(ex._id));
        sessionMeta.set(sId, { week: w, day: d, title: s.title, exerciseIds: exIds });
        sSet.add(sId);

        for (const ex of exs) {
          const exId = oid(ex._id);
          exerciseMeta.set(exId, { week: w, day: d, sessionId: sId, name: ex.name });
          eSet.add(exId);
        }
      }

      dayToSessions.set(dKey, sSet);
      dayToExercises.set(dKey, eSet);
    }

    // 2) Get user progress (completed session + exercise signals)
    const progress = await UserProgressModel.findOne({
      userId: userId,
      rehabPlanId: planId,
    }).lean<any>(); 
    console.log('progress', progress);
    
    const completedExerciseArr = progress?.completedExercises || [];
    const completedSessionArr = progress?.completedSessions || [];
    const weeklyStreak = progress?.streakCountWeekly;
    const monthlyStreak = progress?.streakCountMonthly;

    const completedExerciseIds = new Set<string>(completedExerciseArr.map((e: any) => oid(e.exerciseId)));
    const completedSessionIds = new Set<string>(completedSessionArr.map((s: any) => oid(s.sessionId)));

    // 3) Completed sessions list (+ difficulty)
    const completedSessions = completedSessionArr
      .filter((s: any) => sessionMeta.has(oid(s.sessionId)))
      .map((s: any) => {
        const sId = oid(s.sessionId);
        const meta = sessionMeta.get(sId)!;
        return {
          sessionId: sId,
          title: meta.title,
          week: meta.week,
          day: meta.day,
          difficultyRating: s.difficultyRating ?? null,
          completedAt: s.completedAt ?? null,
          totalExercises: meta.exerciseIds.length,
          // compute completedExercises for the session from exercise completions
          completedExercises: meta.exerciseIds.filter((id) => completedExerciseIds.has(id)).length,
        };
      });

    // 4) Completed exercises list (+ irritability)
    const completedExercises = completedExerciseArr
      .filter((e: any) => exerciseMeta.has(oid(e.exerciseId)))
      .map((e: any) => {
        const exId = oid(e.exerciseId);
        const meta = exerciseMeta.get(exId)!;
        return {
          exerciseId: exId,
          name: meta.name,
          week: meta.week,
          day: meta.day,
          sessionId: meta.sessionId,
          irritabilityScore: e.irritabilityScore ?? null,
          completedAt: e.completedAt ?? null,
        };
      });

    // 5) Determine completed days: a day is completed if all exercises in that day are completed
    const completedDays: { week: number; day: number }[] = [];
    for (const [k, exSet] of dayToExercises.entries()) {
      if (exSet.size === 0) continue; // no exercises -> ignore
      const allDone = [...exSet].every((id) => completedExerciseIds.has(id));
      if (allDone) {
        const [wStr, dStr] = k.split("#");
        completedDays.push({ week: Number(wStr), day: Number(dStr) });
      }
    }
    completedDays.sort((a, b) => (a.week === b.week ? a.day - b.day : a.week - b.week));

    // 6) Completed weeks: a week is completed if *all days with exercises* in that week are completed
    const daysByWeek = new Map<number, { totalDaysWithExercises: number; completedDays: number }>();
    for (const w of weeksSet) daysByWeek.set(w, { totalDaysWithExercises: 0, completedDays: 0 });

    for (const [k, exSet] of dayToExercises.entries()) {
      const [wStr, dStr] = k.split("#");
      const w = Number(wStr);
      if (!daysByWeek.has(w)) daysByWeek.set(w, { totalDaysWithExercises: 0, completedDays: 0 });
      if (exSet.size > 0) {
        const agg = daysByWeek.get(w)!;
        agg.totalDaysWithExercises += 1;
        // completed?
        const isCompleted = [...exSet].every((id) => completedExerciseIds.has(id));
        if (isCompleted) agg.completedDays += 1;
      }
    }

    const completedWeeks = [...daysByWeek.entries()]
      .filter(([, v]) => v.totalDaysWithExercises > 0 && v.completedDays === v.totalDaysWithExercises)
      .map(([w]) => w)
      .sort((a, b) => a - b);

    // 7) Weekly resilience (completed check-ins)
    // const weeklyResilience = await PsychologicalCheckInModel.find({
    //   userId: new mongoose.Types.ObjectId(userId),
    //   rehabPlanId: new mongoose.Types.ObjectId(planId),
    //   status: "completed", // if you kept status; else remove this line
    // })
    //   .select("weekNumber resilienceScore comments submittedAt")
    //   .sort({ weekNumber: 1 })
    //   .lean<any>();
    

    // 8) Shape the payload
    return res.json({
      success: true,
      message: "Completed items with resilience scores.",
      data: {
        planId: plan._id,
        planName: plan.name,
        userId,
        completedWeeks,                         // number[]
        completedDays,                          // [{week, day}]
        completedSessions,                      // [{sessionId, title, week, day, difficultyRating, completedAt, totalExercises, completedExercises}]
        completedExercises,                     // [{exerciseId, name, week, day, sessionId, irritabilityScore, completedAt}]
        // weeklyResilience,                       // [{weekNumber, resilienceScore, comments, submittedAt}]
        weeklyStreak,
        monthlyStreak,
        // progress
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};


// progress percentage 
// @route GET /api/user-progress/progress-percent/:planId
export const getProgressPercent = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(planId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid planId or userId" });
    }

    // 1) Load plan with sessions -> exercises
    const plan = await RehabPlanModel.findById(planId)
      .populate({
        path: "schedule.sessions",
        model: "Session",
        populate: { path: "exercises", model: "Exercise", select: "_id" },
      })
      .lean<any>();

    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // total exercises in plan
    const totalExercises = (plan.schedule || []).reduce((acc: number, item: any) => {
      const sessions = item.sessions || [];
      const exCount = sessions.reduce((sAcc: number, s: any) => sAcc + (s.exercises?.length || 0), 0);
      return acc + exCount;
    }, 0);

    // 2) Load progress
    const progress = await UserProgressModel.findOne({
      userId: userId,
      rehabPlanId: planId,
    }).lean<any>();

    const completedExercises = (progress?.completedExercises || []).length;
   
    const percent = totalExercises > 0
      ? Math.min(100, Math.round((completedExercises / totalExercises) * 100))
      : 0;

    return res.json({
      success: true,
      message: "Progress percentage",
      data: {
        planId: plan._id,
        planName: plan.name,
        totalExercises,
        completedExercises,
        progressPercent: percent,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};


// export const getUserStreakHanlderTesting = async(req: Request, res: Response, next: NextFunction) => {
//   const { planId } = req.params;
//   const userId = req.userId;
  
//   try {
//     const progress = await UserProgressModel.findOne({
//       userId,
//       rehabPlanId: planId,
//     }).lean<any>();

//     res.status(200).json({
//       success: true,
//       message: "User streak and progress fetched successfully.",
//       data: progress
//     })

//   } catch (error) {
//     console.error('getUserStreak error', error);
//     next(error);
//   }
// }

export const getUserStreakHanlderTesting = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { planId } = req.params;
  const userId = req.userId;

  try {
    // 1) Get progress (for completed exercises)
    const progress = await UserProgressModel.findOne({
      userId,
      rehabPlanId: planId,
    }).populate({
      path: "completedExercises.exerciseId",
      model: "Exercise",
    });

    // 2) Get the plan (with exercises populated)
    const plan = await RehabPlanModel.findOne({ _id: planId })
      .select("_id schedule")
      .populate({
        path: "schedule.sessions",
        model: "Session",
        select: "_id exercises",
        populate: {
          path: "exercises",
          model: "Exercise",
          select: "_id name",
        },
      })
      .lean<any>();
      console.log('plan', plan);
      
    if (!plan) throw new ErrorHandler(404, "Rehab plan not found");

    // 3) Build completed set
    const completedKeys = new Set<string>(
      (progress?.completedExercises || []).map(
        (e: any) => `${String(e.sessionId)}-${String(e.exerciseId)}`
      )
    );

    // 4) Count totals
    let totalExercises = 0;
    let completedExercises = 0;

    for (const item of plan.schedule || []) {
      for (const s of item.sessions || []) {
        const sessionId = String(s._id);
        for (const ex of s.exercises || []) {
          totalExercises += 1;
          if (completedKeys.has(`${sessionId}-${String(ex._id)}`)) {
            completedExercises += 1;
          }
        }
      }
    }

    const uncompletedExercises = totalExercises - completedExercises;

    // 5) Response
    return res.status(200).json({
      success: true,
      message: "User progress with uncompleted count",
      data: {
        progress,
        totalExercises,
        completedExercises,
        uncompletedExercises,
      },
    });
  } catch (error) {
    console.error("getUserStreak error", error);
    next(error);
  }
};
