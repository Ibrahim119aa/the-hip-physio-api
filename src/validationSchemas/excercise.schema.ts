import z from "zod";
import domPurify from "../config/domPurifyInstance";

export const createExerciseSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50)
    .transform(value => domPurify.sanitize(value.trim())),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(500)
    .transform(value => domPurify.sanitize(value.trim())),
  reps: z.string()
    .min(1, { message: "Reps are required" })
    .transform(value => domPurify.sanitize(value.trim())),
  sets: z.string()
    .min(1, { message: "Sets are required" })
    .transform(value => domPurify.sanitize(value.trim())),
  category: z.string()
    .min(1, { message: "Reps are required" }),
  categoryName: z.string()
    .min(3, { message: "Category name must be at least 3 characters long" })
    .max(50)
    .transform(value => domPurify.sanitize(value.trim())),
  bodyPart: z.string()
    .min(3, { message: "Body part must be at least 3 characters long" })
    .max(50)
    .transform(value => domPurify.sanitize(value.trim())),
  tags: z.string()
    .min(1, { message: "Tag cannot be empty" })
    .transform(value => domPurify.sanitize(value.trim()))
    .optional(),
  difficulty: z.enum(["Beginner", "Medium", "Advanced"])
    .default("Beginner"),
  estimatedDuration: z.coerce.number()
    .min(1, { message: "Duration must be at least 1 minute" })
    .max(300, { message: "Duration cannot exceed 300 minutes" })
    .optional(),
});

export const updateExerciseSchema = createExerciseSchema
  .extend({
    videoUrl: z.string()
      .url({ message: "Invalid video URL format" })
      .transform(value => domPurify.sanitize(value.trim()))
      .optional(),
    thumbnailUrl: z.string()
      .url({ message: "Invalid thumbnail URL format" })
      .transform(value => domPurify.sanitize(value.trim()))
      .optional()
  })
  .partial();

// Schema for the route params (id parameter)
export const ExerciseParamsSchema = z.object({
  id: z.string().min(1, { message: "ID is required" })
});

// Schema for the category params (category parameter)
export const exerciseCategoryParamSchema = z.object({
  category: z.string().min(1, { message: "category is required" })
});

export type TExerciseRequest = z.infer<typeof createExerciseSchema>;
export type TUpdateExerciseRequest = z.infer<typeof updateExerciseSchema>;
export type TExerciseParams = z.infer<typeof ExerciseParamsSchema>;
export type TExerciseCategoryParams = z.infer<typeof exerciseCategoryParamSchema>;