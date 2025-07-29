import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import { verifyToken } from "../utils/JwtHelpers";
import jwt from "jsonwebtoken";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      userId?: any;
    }
  }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;

    if(req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) { 
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ErrorHandler(401, 'please login.');
    }

    const decoded = verifyToken(token) as jwt.JwtPayload;
    
    if (!decoded) {
      throw new ErrorHandler(401, 'Invalid token.');
    }

    req.userId = decoded.uerId;

    next();

  } catch (error) {
    next(error)
  }
}