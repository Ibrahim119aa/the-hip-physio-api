  import { NextFunction, Request, Response } from "express";
  import ErrorHandler from "../utils/errorHandlerClass";
  import { verifyAdminToken, verifyUserToken } from "../utils/JwtHelpers";
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

  const isUserAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userToken = req.headers.authorization?.startsWith('Bearer ') 
      ? req.headers.authorization.split(' ')[1] 
      : undefined;

    if (!userToken) {
      throw new ErrorHandler(401, 'Please login.');
    }

    const decoded = verifyUserToken(userToken) as jwt.JwtPayload;

    if (!decoded?.userId) {
      throw new ErrorHandler(401, 'Invalid user token.');
    }

    req.userId = decoded.userId;
    next();

  } catch (error) {
    next(error);
  }
}

const isAdminAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminToken = req.cookies.aToken;
    console.log('adminToken', adminToken);
    

    if (!adminToken) {
      throw new ErrorHandler(401, 'Please login as an admin.');
    }

    const decoded = verifyAdminToken(adminToken) as jwt.JwtPayload;
    
    if (!decoded?.adminId) {
      throw new ErrorHandler(401, 'Invalid admin token.');
    }

    req.adminId = decoded.adminId;
    next();

  } catch (error) {
    next(error);
  }
}

export { isUserAuthenticated, isAdminAuthenticated };