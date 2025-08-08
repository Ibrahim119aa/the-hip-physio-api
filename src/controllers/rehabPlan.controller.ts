import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import RehabPlanModel from "../models/rehabPlan.model";
import RehabPlanCategoryModel from "../models/rehabPlanCategory.model";

export const createRehabPlanHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const demoPlan = {
      name: 'testing',
      description: 'A bespoke app-based rehabilitation guide to help with rehab after FAI surgery',
      price: 135,
      planType: 'paid',
      planDurationInWeeks: 5,
      phase: 'phase 1',
      schedule: [], // Add empty schedule for now
      category: ["6894f582c9b7fc9f49774256"],
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
        select: 'title description' // Exclude just the version key, keep all other fields
      })
      .populate({
        path: 'schedule.sessions',
        populate: { // Nested population for exercises
          path: 'exercises',
          model: 'Exercise'
          // No select = get all exercise fields
        }
      })
      .lean();

    if (!rehabPlan) {
      throw new ErrorHandler(404, 'Rehab plan not found');
    }

    res.status(200).json({
      success: true,
      data: rehabPlan
    });

  } catch (error) {
    console.error('getRehabPlanByIdHandler error :', error);
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


export const createRehabPlanCategory = async(req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('this is working',  req.body);
    
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