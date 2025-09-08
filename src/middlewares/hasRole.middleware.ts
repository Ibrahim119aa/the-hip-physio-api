import { NextFunction, Request, Response } from "express"
import ErrorHandler from "../utils/errorHandlerClass"
import UserModel from "../models/user.model";

export const hasRole = (role: string) => {
  return async (req: Request, res: Response, next:NextFunction) => {
    try {
      
      if(!req.adminId) throw new ErrorHandler(401, 'Authentication required');

      const user = await UserModel.findById(req.adminId)
      
      if(!user) throw new ErrorHandler(404, 'User not found.');

      const normalizedUserRole = (user.role || '').trim().toLowerCase();
      const normalizedRequiredRole = (role || '').trim().toLowerCase();

      if(normalizedUserRole !== normalizedRequiredRole) throw new ErrorHandler(403, 'Unauthorized - access required.');

      next();

    } catch (error) {
      console.error("Error in hasRole middleware:", error);
      next(error)
    }
  }
}
