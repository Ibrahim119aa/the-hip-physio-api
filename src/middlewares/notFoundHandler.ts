import { NextFunction, Request, Response } from "express";
import APiErrorHandler from "../utils/errorHandlerClass";

const notFoundHandler = async (req: Request, res: Response, next: NextFunction) => {
  next(new APiErrorHandler(404, `Route ${req.originalUrl} not found`));
  // next(new APiErrorHandler(404, `Route ${req.url} not found`));
}

export default notFoundHandler;