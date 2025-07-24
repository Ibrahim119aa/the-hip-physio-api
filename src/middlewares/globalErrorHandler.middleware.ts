import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/errorHandlerClass";
import config from "../config/config";

const globalErrorHandler = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {

  err.message = err.message || "internal service error"
  err.statusCode = err.statusCode || 500

  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    stack: config.environment === "development" ? err.stack : null,
  })
}

export default globalErrorHandler;