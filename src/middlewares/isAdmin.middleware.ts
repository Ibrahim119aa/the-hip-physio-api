import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { verifyToken } from "../utils/JwtHelpers";
import UserModel from "../models/user.model";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;

    if(req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) { 
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ErrorHandler(401, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyToken(token) as any;
    if (!decoded) {
      throw new ErrorHandler(401, 'Invalid token.');
    }

    // Find user and check if they exist
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new ErrorHandler(401, 'User not found.');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ErrorHandler(401, 'User account is inactive.');
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      throw new ErrorHandler(403, 'Access denied. Admin privileges required.');
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    next(error);
  }
};

// Optional: Regular user auth middleware (for read-only operations)
export const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ErrorHandler(401, 'Access denied. No token provided.');
    }

    // Verify token
    const decoded = verifyToken(token) as any;
    if (!decoded) {
      throw new ErrorHandler(401, 'Invalid token.');
    }

    // Find user and check if they exist
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new ErrorHandler(401, 'User not found.');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ErrorHandler(401, 'User account is inactive.');
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('User auth middleware error:', error);
    next(error);
  }
}; 