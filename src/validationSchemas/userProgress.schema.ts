// src/validators/completedExercise.schema.ts
import { z } from "zod";
import domPurify from "../config/domPurifyInstance";


export const CompleteExerciseSchema = z
  .object({
    planId: z
      .string()
      .min(1, { message: "planId is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    sessionId: z
      .string()
      .min(1, { message: "sessionId is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    exerciseId: z
      .string()
      .min(1, { message: "exerciseId is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    irritabilityScore: z
      .coerce.number()
      .int()
      .min(0, { message: "irritabilityScore must be between 0 and 10" })
      .max(10, { message: "irritabilityScore must be between 0 and 10" }),

    timezone: z
      .string()
      .min(1, { message: "timezone is required" })
      .transform((value) => domPurify.sanitize(value.trim())),
  })

export const MarkSessionCompleteSchema = z
  .object({
    planId: z
      .string()
      .min(1, { message: "planId is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    sessionId: z
      .string()
      .min(1, { message: "sessionId is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    // optional, but if present must be exactly one of these
    difficultyRating: z
      .string()
      .transform((value) => domPurify.sanitize(value.trim()))
      .pipe(z.enum(["too easy", "just right", "too hard"]))
      .optional(),

    timezone: z
      .string()
      .min(1, { message: "timezone is required" })
      .transform((value) => domPurify.sanitize(value.trim())),

    // "user note is a string only" → optional sanitized string
    userNote: z
      .string()
      .transform((value) => domPurify.sanitize(value.trim()))
      .optional(),
  })

export type TMarkSessionCompleteRequest = z.infer<typeof MarkSessionCompleteSchema>;
export type TCompleteExerciseRequest = z.infer<typeof CompleteExerciseSchema>;
