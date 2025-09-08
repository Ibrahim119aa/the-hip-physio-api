import { z } from "zod";
import domPurify from "../config/domPurifyInstance";


export const EducationalVideoParamsSchema = z.object({
  id: z.string()
    .min(1, { message: "ID is required" })
    .transform((value) => domPurify.sanitize(value.trim())),
});

export const createEducationalVideoSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .transform((value) => domPurify.sanitize(value.trim())),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .transform((value) => domPurify.sanitize(value.trim())),
  // categories can be string (csv/json) or string[]
  categories: z.union([z.string(), z.array(z.string())]).optional(),
  duration: z.coerce.number()
    .min(1, { message: "Duration must be at least 1 minute" })
    .max(300, { message: "Duration cannot exceed 300 minutes" })
    .optional(),
});

export const updateEducationalVideoSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .transform((value) => domPurify.sanitize(value.trim()))
    .optional(),
  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .transform((value) => domPurify.sanitize(value.trim()))
    .optional(),
  thumbnailUrl: z.string()
    .url()
    .transform((value) => domPurify.sanitize(value.trim()))
    .optional(), // If provided, overrides/keeps without upload
  categories: z.union([z.string(), z.array(z.string())]).optional(),
  duration: z.coerce.number()
    .min(1, { message: "Duration must be at least 1 minute" })
    .max(300, { message: "Duration cannot exceed 300 minutes" })
    .optional(),
});

export type TCreateEducationalVideoRequest = z.infer<typeof createEducationalVideoSchema>;
export type TEduVideoParams = z.infer<typeof EducationalVideoParamsSchema>;
export type TUpdateEducationalVideoRequest = z.infer<typeof updateEducationalVideoSchema>;