import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import RehabPlanModel from "../models/rehabPlan.model";
import RehabPlanCategoryModel from "../models/rehabPlanCategory.model";
import UserProgressModel from "../models/userProgress.model";
import SessionModel from "../models/session.model";
import ExerciseModel from "../models/exercise.model";

export const createRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('req.body', req.body);
    
    const {
      name,
      description,
      price,
      planType,
      planDurationInWeeks,
      phase,
      category
    } = req.body;

    // const demoPlan = {
    //   name: 'testing',
    //   description: 'A bespoke app-based rehabilitation guide to help with rehab after FAI surgery',
    //   price: 135,
    //   planType: 'paid',
    //   planDurationInWeeks: 5,
    //   phase: 'phase 1',
    //   schedule: [], // Add empty schedule for now
    //   category: ["6894f582c9b7fc9f49774256"],
    //   stats: {
    //     exerciseCount: 19, // Static value for now
    //     totalMinutes: 90, // Static value for now
    //   },
    //   createdBy: req.userId
    // };
    const savePlan = new RehabPlanModel({
      name,
      description,
      price,
      planType,
      planDurationInWeeks,
      phase,
      category,
      createdBy: "688a482be8f40c8e173608c6"
    });
    
    const createdPlan = await savePlan.save();

    res.status(201).json({
      success: true,
      data: createdPlan
    });

  } catch (error) {
    console.error('createRehabPlanHandler error :', error);
    next(error)
  }
}

export const updateRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  console.log('working api update');
  
  try {
    const { planId } = req.params;
    const updateData = req.body;

    console.log('req.params', req.params);
    console.log('req.body', req.body);
    
    // Validate planId
    if (!planId) {
      throw new ErrorHandler(400, 'Plan ID is required');
    }

    // Find and update the rehab plan
    const updatedPlan = await RehabPlanModel.findByIdAndUpdate(planId, updateData, { new: true });

    if (!updatedPlan) {
      throw new ErrorHandler(404, 'Rehab plan not found');
    }

    res.status(200).json({
      success: true,
      data: updatedPlan
    });

  } catch (error) {
    console.error('updateRehabPlanHandler error :', error);
    next(error)
  }
}

export const deleteRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {

  } catch (error) {
    console.error('deleteRehabPlanHandler error :', error);
    next(error)
  }
}

export const getRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {

  } catch (error) {
    console.error('getRehabPlanHandler error :', error);
    next(error)
  }
}

export const getRehabPlanByIdHandler = async(req: Request, res: Response, next: NextFunction) => {
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

export const getRehabPlanByIdHandler2 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { planId } = req.params;
    const userId = req.user?._id; // assuming auth middleware

    if (!planId) throw new ErrorHandler(400, 'Plan ID is required');

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

    if (!rehabPlan) throw new ErrorHandler(404, 'Rehab plan not found');

    let userProgress = await UserProgressModel.findOne({ userId, rehabPlanId: planId });
    if (!userProgress) {
      userProgress = { completedExercises: [], completedSessions: [] };
    }

    // Merge completion flags
    rehabPlan.schedule = rehabPlan.schedule.map((day: any) => {
      const sessionsWithStatus = day.sessions.map((session: any) => {
        const isSessionCompleted = userProgress.completedSessions?.includes(session._id.toString());
        const exercisesWithStatus = session.exercises.map((ex: any) => ({
          ...ex,
          isCompleted: userProgress.completedExercises?.includes(ex._id.toString())
        }));
        return { ...session, isCompleted: isSessionCompleted, exercises: exercisesWithStatus };
      });
      return { ...day, sessions: sessionsWithStatus };
    });

    res.status(200).json({
      success: true,
      data: rehabPlan
    });
  } catch (error) {
    console.error('getRehabPlanByIdHandler error:', error);
    next(error);
  }
};


// export const getAllRehabPlansHandler = async(req: Request, res: Response, next: NextFunction) => {
//  try {

//     const rehabPlans = await RehabPlanModel.find()
//       .populate({
//         path: 'category',
//         select: 'title description'
//       })
//       .populate({
//         path: 'schedule.sessions',
//         populate: { 
//           path: 'exercises',
//           model: 'Exercise'

//         }
//       })
//       .lean();

//     if(!rehabPlans || rehabPlans.length === 0) {
//       throw new ErrorHandler(404, 'No rehab plans found');
//     }
        
//     res.status(200).json({
//       success: true,
//       data: rehabPlans
//     });

//   } catch (error) {
//     console.error('getRehabPlansHandler error:', error);
//     next(error);
//   }
// }


export const getAllRehabPlansHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const catColl = RehabPlanCategoryModel.collection.name; // safe actual names
    const sessColl = SessionModel.collection.name;
    const exColl   = ExerciseModel.collection.name;

    const pipeline: any[] = [
      {
        $project: {
          name: 1,
          planDurationInWeeks: 1,
          category: 1,
          schedule: { $ifNull: ["$schedule", []] },
        },
      },
      // Categories (array)
      {
        $lookup: {
          from: catColl,
          localField: "category",
          foreignField: "_id",
          as: "categories",
          pipeline: [{ $project: { _id: 1, title: 1 } }],
        },
      },
      // Expand schedule entries
      { $unwind: { path: "$schedule", preserveNullAndEmptyArrays: true } },
      // Track distinct weeks as we go
      {
        $addFields: {
          _weekForSet: "$schedule.week"
        }
      },
      // Expand session ids per schedule occurrence
      { $unwind: { path: "$schedule.sessions", preserveNullAndEmptyArrays: true } }, // each is a Session _id
      // Pull session -> exercises (array)
      {
        $lookup: {
          from: sessColl,
          localField: "schedule.sessions",
          foreignField: "_id",
          as: "sessionDoc",
          pipeline: [{ $project: { exercises: 1 } }],
        },
      },
      { $unwind: { path: "$sessionDoc", preserveNullAndEmptyArrays: true } },
      // Expand exercise occurrences
      { $unwind: { path: "$sessionDoc.exercises", preserveNullAndEmptyArrays: true } }, // each is an Exercise _id
      // Pull exercise duration
      {
        $lookup: {
          from: exColl,
          localField: "sessionDoc.exercises",
          foreignField: "_id",
          as: "exerciseDoc",
          pipeline: [{ $project: { estimatedDuration: 1 } }],
        },
      },
      { $unwind: { path: "$exerciseDoc", preserveNullAndEmptyArrays: true } },

      // Aggregate back per plan
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          planDurationInWeeks: { $first: "$planDurationInWeeks" },
          categories: { $first: "$categories" },
          weeksSet: { $addToSet: "$_weekForSet" },
          // count each exercise occurrence (after unwind) only when it exists
          totalExercises: {
            $sum: {
              $cond: [{ $ifNull: ["$exerciseDoc._id", false] }, 1, 0]
            }
          },
          // sum durations safely; if your estimatedDuration is already MINUTES, remove the /60 later
          totalSeconds: {
            $sum: {
              $convert: {
                input: "$exerciseDoc.estimatedDuration",
                to: "double",
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      },

      // Final computed fields
      {
        $addFields: {
          totalWeeks: {
            $cond: [
              { $gt: [{ $size: "$weeksSet" }, 0] },
              { $size: "$weeksSet" },
              "$planDurationInWeeks"
            ]
          },
          // If estimatedDuration is already in MINUTES, just use { $ceil: "$totalSeconds" } instead.
          totalMinutes: { $ceil: { $divide: ["$totalSeconds", 60] } }
        }
      },

      // Output shape
      {
        $project: {
          _id: 1,
          title: "$name",
          totalWeeks: 1,
          totalMinutes: 1,
          categories: 1,
          totalExercises: 1 // remove this line if you don't want it in the response
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

export const createRehabPlanCategory = async(req: Request, res: Response, next: NextFunction) => {
  try {
    
    const { title, description } = req.body;

    if (!title || !description) {
      throw new ErrorHandler(400, 'title and description are required');
    }

    const newCategory = await RehabPlanCategoryModel.create({
      title,
      description,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      data: newCategory
    });

  } catch (error) {
    console.error('createRehabPlanCategory error:', error);
    next(error);
  }
}

export const getAllRehabPlanCategories = async(req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('this is working')
    const categories = await RehabPlanCategoryModel.find({}).lean();
    console.log('categories', categories);
    
    if(!categories || categories.length === 0) {
      throw new ErrorHandler(404, 'No categories found');
    }

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('getAllRehabPlanCategories error:', error);
    next(error);
  }
}