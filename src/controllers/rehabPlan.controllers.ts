import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import RehabPlanModel from "../models/rehabPlan.model";
import RehabPlanCategoryModel from "../models/rehabPlanCategory.model";
import UserProgressModel from "../models/userProgress.model";
import SessionModel from "../models/session.model";
import ExerciseModel from "../models/exercise.model";
import mongoose from "mongoose";
import { createRehabPlanPhaseSchema, planIdParamSchema, TPlanIdParams, TRehabPlanCreateRequest, TUpdateRehabPlanRequest, updateRehabPlanSchema } from "../validationSchemas/rehabPlan.schema";
import UserModel from "../models/user.model";

export const createRehabPlanHandler = async(
  req: Request<{}, {}, TRehabPlanCreateRequest>, 
  res: Response, 
  next: NextFunction
) => {
  try {

    const parsedBody = createRehabPlanPhaseSchema.safeParse(req.body)
    const adminId = req.adminId
    console.log('req.body', req.body);
    console.log('req. parse', parsedBody);
    console.log('admin', adminId);
    
    
    if (!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map(issue => issue.message).join(', ');
      throw new ErrorHandler(400, errorMessages);
    }
    
    const {
      name,
      description,
      price,
      planType,
      planDurationInWeeks,
      weekStart,   // number | null
      weekEnd,     // number | null
      openEnded,
      phase,       // string | null
      category     // string[]
    } = parsedBody.data;

    if (planType === "free" && price !== 0) {
      throw new ErrorHandler(400, "Free plan must have price = 0");
    }

    if (
      weekStart !== null &&
      weekEnd !== null &&
      typeof weekStart === "number" &&
      typeof weekEnd === "number" &&
      weekEnd < weekStart
    ) {
      throw new ErrorHandler(400, "weekEnd must be greater than or equal to weekStart");
    }

    // 4) Create plan (schedule left empty by default)
    const plan = await RehabPlanModel.create({
      name,
      description,
      price,
      planType,
      planDurationInWeeks,
      weekStart,    // will store null or number correctly
      weekEnd,
      openEnded,
      phase,
      category,
      createdBy: adminId,
    });
    
    res.status(201).json({
      success: true,
      message: "Rehab plan created successfully",
      data: plan
    });

  } catch (error) {
    console.error('createRehabPlanHandler error :', error);
    next(error)
  }
}

export const updateRehabPlanHandler = async (
  req: Request<TPlanIdParams, {}, TUpdateRehabPlanRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    
    const parsedParams = planIdParamSchema.safeParse(req.params);
    
    if (!parsedParams.success) {
      return next(new ErrorHandler(400, "Invalid plan id"));
    }
    
    const { planId } = parsedParams.data;

    // Validate body (simple schema; all fields optional; createdBy is not allowed)
    const parsedBody = updateRehabPlanSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map((issue) => issue.message).join(", ");
      throw new ErrorHandler(400, errorMessages);
    }

    const data = parsedBody.data;

    // If nothing to update, bail early
    if (Object.keys(data).length === 0) {
      throw new ErrorHandler(400, "Nothing to update");
    }

    // Minimal business rules (kept out of Zod per your preference)
    if (data.planType === "free" && data.price !== undefined && data.price !== 0) {
      throw new ErrorHandler(400, "Free plan must have price = 0");
    }

    if (
      data.weekStart !== undefined &&
      data.weekEnd !== undefined &&
      data.weekStart !== null &&
      data.weekEnd !== null &&
      typeof data.weekStart === "number" &&
      typeof data.weekEnd === "number" &&
      data.weekEnd < data.weekStart
    ) {
      throw new ErrorHandler(400, "weekEnd must be greater than or equal to weekStart");
    }

    // Build update doc without undefineds
    const updateDoc: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = (data as any)[key];
        if (value !== undefined) updateDoc[key] = value;
      }
    }

    // Update with validators ON to respect Mongoose schema rules
    const updated = await RehabPlanModel.findByIdAndUpdate(planId, updateDoc, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) throw new ErrorHandler(404, "Rehab plan not found");

    res.status(200).json({
      success: true,
      message: "Rehab plan updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateRehabPlanHandler error:", error);
    next(error);
  }
};


export const deleteRehabPlanHandler = async (
  req: Request<TPlanIdParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedParams = planIdParamSchema.safeParse(req.params);
   
    if (!parsedParams.success) {
      return next(new ErrorHandler(400, "Invalid plan id"));
    }
    const { planId } = parsedParams.data;

    const deleted = await RehabPlanModel.findByIdAndDelete(planId).lean();
  
    if (!deleted) throw new ErrorHandler(404, "Rehab plan not found");

    res.status(200).json({
      success: true,
      message: "Rehab plan deleted successfully",
      // data: deleted,
    });

  } catch (error) {
    console.error("deleteRehabPlanHandler error:", error);
    next(error);
  }
};

export const assigPlanToUserHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params
    const { userId } = req.body

    const plan = await RehabPlanModel.find({ _id: planId });
    if(!plan) throw new ErrorHandler(404, 'Rehab plan not found');

    const user = await UserModel.findById(userId);
    if (!user) throw new ErrorHandler(404, 'User not found');

    // 3. Check if the user has already purchased the plan
    const alreadyAssigned = user.purchasedPlans.some( (purchasedPlanId: any) => purchasedPlanId.toString() === planId);

    if (alreadyAssigned) {
      throw new ErrorHandler(400, 'User is already assigned this rehab plan');
    } else {
      user.purchasedPlans.push(planId);
      await user.save();
    }
    res.status(200).json({
      success: true,
      message: 'Rehab plan assigned to user successfully',
    });

  } catch (error) {
    console.error('assigPlanToUserHandler error :', error);
    next(error)
  }
}

// export const updateRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
//   console.log('working api update');
  
//   try {
//     const { planId } = req.params;
//     const updateData = req.body;

//     console.log('req.params', req.params);
//     console.log('req.body', req.body);
    
//     // Validate planId
//     if (!planId) {
//       throw new ErrorHandler(400, 'Plan ID is required');
//     }

//     // Find and update the rehab plan
//     const updatedPlan = await RehabPlanModel.findByIdAndUpdate(planId, updateData, { new: true });

//     if (!updatedPlan) {
//       throw new ErrorHandler(404, 'Rehab plan not found');
//     }

//     res.status(200).json({
//       success: true,
//       data: updatedPlan
//     });

//   } catch (error) {
//     console.error('updateRehabPlanHandler error :', error);
//     next(error)
//   }
// }

// export const deleteRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
//   try {

//   } catch (error) {
//     console.error('deleteRehabPlanHandler error :', error);
//     next(error)
//   }
// }

// export const getRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
//   try {

//   } catch (error) {
//     console.error('getRehabPlanHandler error :', error);
//     next(error)
//   }
// }

export const getRehabPlanByIdHandler01 = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;

    if (!planId) {
      throw new ErrorHandler(400, 'Plan ID is required');
    }

    const rehabPlan = await RehabPlanModel.findById(planId)
    .populate({
        path: 'category',
        select: 'title description'
      })
      .populate({
        path: 'schedule.sessions',
        populate: { 
          path: 'exercises',
          model: 'Exercise'

        }
      })
      
      const numberOfWeeks = new Set(rehabPlan.schedule?.map((week: any) => week.week)).size;

      const numberOfSessions = rehabPlan.schedule?.map((week: any) => week.sessions);
      const numberOfDays = rehabPlan.schedule?.map((day: any) => day.day);
      const totalDurationInSeconds = rehabPlan.schedule
        .flatMap((week: any) => week.sessions)
        .flatMap((session: any) => session.exercises)
        .reduce((sum: number, exercise: any) => sum + (exercise.estimatedDuration || 0), 0)
      const totalDurationInMinutes = Math.ceil(totalDurationInSeconds / 60);

    if (!rehabPlan) {
      throw new ErrorHandler(404, 'Rehab plan not found');
    }

    res.status(200).json({
      success: true,
      data: rehabPlan,
      stats: {
        numberOfWeeks: numberOfWeeks,
        numberOfSessions: numberOfSessions.length,
        numberOfDays: numberOfDays.length,
        totalDuration: totalDurationInMinutes
      }
    });

  } catch (error) {
    console.error('getRehabPlanByIdHandler error :', error);
    next(error)
  }
}

// Small helper to normalize ObjectId -> string
const oid = (v: any) => String((v as mongoose.Types.ObjectId) ?? v);

export const getRehabPlanByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { planId } = req.params;
    const userId = req.userId;

    if (!planId) throw new ErrorHandler(400, "Plan ID is required");
    if (!userId) throw new ErrorHandler(400, "User ID is required");

    // 1) Pull plan with schedule -> sessions -> exercises (and exercise.category) populated
    const plan = await RehabPlanModel.findById(planId)
      .populate({
        path: "category",
        select: "title description",
      })
      .populate({
        path: "schedule.sessions",
        model: "Session",
        populate: {
          path: "exercises",
          model: "Exercise",
          select:
            "_id name description videoUrl thumbnailUrl reps sets category tags bodyPart difficulty estimatedDuration createdBy createdAt updatedAt",
          populate: {
            path: "category",              // exercise.category reference
            model: "ExerciseCategory",     // <- change if your model name differs
            select: "_id title slug",
          },
        },
      })
      .lean<any>();

    if (!plan) throw new ErrorHandler(404, "Rehab plan not found");

    // 2) Get user progress for this plan
    const progress = await UserProgressModel.findOne({
      userId: userId,
      rehabPlanId: planId,
    }).lean<any>();

    // const completedExerciseIds = new Set<string>(
    //   (progress?.completedExercises || []).map((e: any) => oid(e.exerciseId))
    // );
    const completedExerciseKeys = new Set<string>(
      (progress?.completedExercises || []).map( (e: any) => `${oid(e.sessionId)}-${oid(e.exerciseId)}` )
    );
    const completedSessionIds = new Set<string>(
      (progress?.completedSessions || []).map((s: any) => oid(s.sessionId))
    );

    // 3) Sort schedule by week/day and group days per week
    const schedule = (plan.schedule || []).slice().sort((a: any, b: any) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.day - b.day;
    });

    const weekMap = new Map<number, any[]>();

    for (const item of schedule) {
      const arr = weekMap.get(item.week) || [];
      arr.push(item);
      weekMap.set(item.week, arr);
    }

    // 4) Build organized structure (weeks -> days -> sessions) with strict unlocking rules
    const weeksOut: any[] = [];
    
    const totals = {
      totalExercises: 0,
      completedExercises: 0,
      totalSessions: 0,
      completedSessions: 0,
    };

    const allWeeks = [...weekMap.keys()].sort((a, b) => a - b);

    // Week unlocking gate: Week 1 handled specially; other weeks depend on previous week completion
    let prevWeekCompleted = false;

    for (const w of allWeeks) {
      const daysForWeek = weekMap.get(w)!;

      // Week unlocked: W1 always unlocked; others only if previous week completed
      const weekUnlocked = w === 1 ? true : prevWeekCompleted;

      let weekCompleted = true;
      const daysOut: any[] = [];

      // Day unlocking gate: Day 1 always unlocked (when week is unlocked), others depend on previous day completion
      let prevDayCompleted = false;

      for (const dayItem of daysForWeek) {
        const sessions = dayItem.sessions || [];
        const sessionsOut: any[] = [];

        let dayTotalExercises = 0;
        let dayCompletedExercises = 0;

        for (const s of sessions) {
          const sessionId = oid(s._id);
          const exercises = (s.exercises || []) as any[];

          const sTotal = exercises.length;
          // const sDoneCount = exercises.reduce(
          //   (acc, ex) => acc + (completedExerciseIds.has(oid(ex._id)) ? 1 : 0),
          //   0
          // );
    
          const sDoneCount = exercises.reduce(
            (acc, ex) =>
              acc + (completedExerciseKeys.has(`${sessionId}-${oid(ex._id)}`) ? 1 : 0),
            0
          );
    
          // const sCompleted =
          //   (sTotal > 0 && sDoneCount === sTotal) ||
          //   completedSessionIds.has(sessionId);

          const sCompleted = completedSessionIds.has(sessionId);

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
            exercises: exercises.map((ex) => ({
              _id: ex._id,
              name: ex.name,
              thumbnailUrl: ex.thumbnailUrl,
              sets: ex.sets,
              reps: ex.reps,
              estimatedDuration: ex.estimatedDuration,
              videoUrl: ex.videoUrl,
              completed: completedExerciseKeys.has(`${sessionId}-${oid(ex._id)}`),
              // populated category object if available
              category: ex.category ?? null,
              // keep any other fields you want to expose (difficulty, tags, etc.)
              difficulty: ex.difficulty,
              tags: ex.tags,
              bodyPart: ex.bodyPart,
            })),
          });
        }

        totals.totalExercises += dayTotalExercises;
        totals.completedExercises += dayCompletedExercises;

        // const dayCompleted = dayTotalExercises > 0 && dayCompletedExercises === dayTotalExercises;
        const dayCompleted = sessionsOut.length > 0 && sessionsOut.every(s => s.completed);

        // Day unlocked: week must be unlocked; Day 1 always unlocked; Day N>1 only if previous day completed
        const dayUnlocked = weekUnlocked && (dayItem.day === 1 ? true : prevDayCompleted);

        daysOut.push({
          day: dayItem.day,
          unlocked: dayUnlocked,
          completed: dayCompleted,
          totalExercises: dayTotalExercises,
          completedExercises: dayCompletedExercises,
          sessions: sessionsOut,
        });

        // Gate next day
        prevDayCompleted = dayCompleted;

        // Track week completion
        if (!dayCompleted) weekCompleted = false;
      }

      weeksOut.push({
        week: w,
        unlocked: weekUnlocked,
        completed: weekCompleted,
        days: daysOut,
      });

      // Gate next week
      prevWeekCompleted = weekCompleted;
    }

    // 5) Determine current position (first unlocked & not completed day)
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
      if (wk.unlocked && wk.days.length) {
        currentWeek = wk.week;
        currentDay = wk.days[wk.days.length - 1].day;
      }
    }

    // 6) Response
    return res.status(200).json({
      success: true,
      data: {
        planInfo: {
          _id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          planType: plan.planType,
          planDurationInWeeks: plan.planDurationInWeeks,
          phase: plan.phase,
          category: plan.category, // already populated (title, description)
        },
        schedule: {
          weeks: weeksOut,
          currentWeek,
          currentDay,
          totals,
        },
      },
    });
  } catch (error) {
    console.error("getRehabPlanByIdHandler error:", error);
    next(error);
  }
};

export const getAllRehabPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catColl = RehabPlanCategoryModel.collection.name; // safe actual names
    const sessColl = SessionModel.collection.name;
    const exColl   = ExerciseModel.collection.name;

    const pipeline = [
      {
        $project: { 
          name: 1, 
          description: 1,
          price: 1,
          planType: 1,
          phase: 1,
          weekStart: 1,
          weekEnd: 1,
          openEnded: { $ifNull: ["$openEnded", false] },
          planDurationInWeeks: 1, 
          category: 1, 
          schedule: { $ifNull: ["$schedule", []] } 
        } 
      },

      // Track distinct weeks without expanding everything
      { $addFields: { weeksSet: { $setUnion: [[] , "$schedule.week"] } } },

      // Aggregate sessions + exercises INSIDE subpipeline
      {
        $lookup: {
          from: sessColl,
          let: { sIds: { $reduce: {
            input: "$schedule.sessions",
            initialValue: [],
            in: { $setUnion: ["$$value", "$$this"] } // dedupe session IDs across days
          }}},
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$sIds"] } } },
            { $unwind: { path: "$exercises", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: exColl,
                localField: "exercises",
                foreignField: "_id",
                as: "ex",
                pipeline: [{ $project: { estimatedDuration: 1 } }]
              }
            },
            { $unwind: { path: "$ex", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                totalExercises: { $sum: { $cond: [{ $ifNull: ["$ex._id", false] }, 1, 0] } },
                totalSeconds: { $sum: { $convert: { input: "$ex.estimatedDuration", to: "double", onNull: 0, onError: 0 } } }
              }
            }
          ],
          as: "sessAgg"
        }
      },
      {
        $addFields: {
          totalWeeks: {
            $cond: [
              { $gt: [{ $size: "$weeksSet" }, 0] },
              { $size: "$weeksSet" },
              "$planDurationInWeeks"
            ]
          },
          totalExercises: { $ifNull: [{ $first: "$sessAgg.totalExercises" }, 0] },
          totalMinutes:   { $ceil: { $divide: [{ $ifNull: [{ $first: "$sessAgg.totalSeconds" }, 0] }, 60] } }
        }
      },
      // Now get categories once per plan
      {
        $lookup: {
          from: catColl,
          localField: "category",
          foreignField: "_id",
          as: "categories",
          pipeline: [{ $project: { _id: 1, title: 1 } }]
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          price: 1,
          planType: 1,
          phase: 1,
          weekStart: 1,
          weekEnd: 1,
          openEnded: { $ifNull: ["$openEnded", false] },
          planDurationInWeeks: { $ifNull: ["$planDurationInWeeks", null] },
          // compute week badge
          // weekBadge: {
          //   $cond: [
          //     { $ne: ["$weekStart", null] }, // range mode if weekStart is set (0 counts as set)
          //     {
          //       $concat: [
          //         "Week ",
          //         { $toString: "$weekStart" },
          //         "-",
          //         {
          //           $toString: {
          //             $ifNull: [
          //               "$weekEnd",
          //               { $add: ["$weekStart", "$planDurationInWeeks"] } // fallback
          //             ]
          //           }
          //         },
          //         { $cond: [ { $ifNull: ["$openEnded", false] }, "+", "" ] }
          //       ]
          //     },
          //     { $concat: [ { $toString: "$planDurationInWeeks" }, "-Weeks" ] } // duration-only
          //   ]
          // },
          
          totalWeeks: 1,
          totalMinutes: 1,
          totalExercises: 1,
          categories: 1,
        }
      }
    ];

    const data = await RehabPlanModel.aggregate(pipeline).allowDiskUse(true);
    
    if (!data.length) throw new ErrorHandler(404, "No rehab plans found");
    
    res.status(200).json({ 
      success: true,
      message: "Rehab plans fetched successfully", 
      data 
    });
    
  } catch (err) {
    console.error("getAllRehabPlansHandler error:", err);
    next(err);
  }
};