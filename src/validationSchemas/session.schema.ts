// src/validators/session.schema.ts
import { z } from "zod";
import domPurify from "../config/domPurifyInstance";

export const CreateSessionSchema= z.object({
  title: z.string()
    .min(1, { message: "Title is required" })
    .transform((value) => domPurify.sanitize(value.trim())),

  rehabPlan: z.string()
    .min(1, { message: "Rehab plan ID is required" })
    .transform((value) => domPurify.sanitize(value.trim())),

  weekNumber: z.coerce.number()
    .int() 
    .min(1, { message: "weekNumber must be at least 1" }),

  dayNumber: z.coerce.number()
    .int()
    .min(1, { message: "dayNumber must be at least 1" }),

  exercises: z.array(
    z.string()
      .min(1, { message: "Exercise ID cannot be empty" })
      .transform((value) => domPurify.sanitize(value.trim()))
    )
    .optional()
    .default([]),
});


// Optional params schema (simple, v4-safe)
export const SessionParamsSchema = z.object({
  sessionId: z.string()
    .min(1, { message: "session Id is required" })
    .transform((value) => domPurify.sanitize(value.trim())),
  });


export type TCreateSessionRequest = z.infer<typeof CreateSessionSchema>;
export type TSessionParams = z.infer<typeof SessionParamsSchema>;

