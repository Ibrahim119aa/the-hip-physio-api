import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod/v3";
import ErrorHandler from "../utils/errorHandlerClass";

export const validateAndSanitize = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        // query: req.query,
      });

      // if validation fails
      if(!result.success) {
        const errorMessages = result.error.issues.map((issue: any) => issue.message).join(", ");
        throw new ErrorHandler(400, errorMessages);
      }

      // if validation is successful
      req.body = result.data.body;
      req.params = result.data.params;
      // req.query = result.data.query;

      next();

    } catch (error) {
      next(error);
    }
  }
}