import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import RehabPlanModel from "../models/rehabPlan.model";

export const createRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const demoPlan = {
      name: 'FAI Post Surgery',
      description: 'A bespoke app-based rehabilitation guide to help with rehab after FAI surgery',
      price: 135,
      planType: 'paid',
      planDurationInWeeks: 5,
      phase: 'phase 1',
      schedule: [], // Add empty schedule for now
      stats: {
        exerciseCount: 19, // Static value for now
        totalMinutes: 90, // Static value for now
      },
      createdBy: req.userId
    };

    const createdPlan = await RehabPlanModel.create(demoPlan);

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
  try {

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

export const getAllRehabPlansHandler = async(req: Request, res: Response, next: NextFunction) => {
 try {
    // 1. Fetch all rehab plans from MongoDB
    const rehabPlans = await RehabPlanModel.find({}).lean();

    if(!rehabPlans || rehabPlans.length === 0) {
      throw new ErrorHandler(404, 'No rehab plans found');
    }

    // 2. Enhance each plan with stats (using your static values for now)
    // const enhancedPlans = rehabPlans.map(plan => ({
    //   ...plan,
    //   stats: {
    //     exerciseCount: 18,       // Static value for now
    //     totalMinutes: 80,       // Static value for now
    //     weekCount: plan.planDurationInWeeks  // Real value from DB
    //   }
    // }));

    // 3. Send the enhanced data
    res.status(200).json({
      success: true,
      data: rehabPlans
    });

  } catch (error) {
    console.error('getRehabPlansHandler error:', error);
    next(error);
  }
}