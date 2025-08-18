  import { NextFunction, Request, Response } from "express";
  import ErrorHandler from "../utils/errorHandlerClass";
  import { verifyToken } from "../utils/JwtHelpers";
  import jwt from "jsonwebtoken";

  // Extend Request interface to include user
  declare global {
    namespace Express {
      interface Request {
        userId?: any;
        adminId?: any;
      }
    }
  }

  export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminToken = req.cookies.aToken;
    const userToken = req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : undefined;

    if (!adminToken && !userToken) {
      throw new ErrorHandler(401, 'Please login.');
    }

    if (adminToken) {
      const decoded = verifyToken(adminToken) as jwt.JwtPayload;
      
      if (!decoded?.adminId) {
        throw new ErrorHandler(401, 'Invalid admin token.');
      }

      req.adminId = decoded.adminId;
    }

    if (userToken) {
      const decoded = verifyToken(userToken) as jwt.JwtPayload;
      
      if (!decoded?.userId) {
        throw new ErrorHandler(401, 'Invalid user token.');
      }

      req.userId = decoded.userId;
    }

    next();

  } catch (error) {
    next(error);
  }
};