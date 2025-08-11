import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import UserModel from "../models/user.model";
import { generateTokenAndSaveCookies } from "../utils/JwtHelpers";

export const adminLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new ErrorHandler(400, 'Email and password are required');
    }
    
    const user = await UserModel.findOne({ email });
    if (!user) throw new ErrorHandler(404, 'Invalid credentials');
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ErrorHandler(404, 'Invalid credentials');

    // Generate JWT token and save in cookies
    const token = generateTokenAndSaveCookies(
      {
        userId: user._id, 
        email: user.email,
      }, 
      res
    );
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        purchasedPlans: user.purchasedPlans,
        status: user.status
      }
    });

  } catch (error) {
    console.error('loginHandler error', error);
    next(error)
  }
}