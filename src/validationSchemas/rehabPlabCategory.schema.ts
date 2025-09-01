import z from "zod";
import domPurify from "../config/domPurifyInstance";

export const rehabPlanCategorySchema = z.object({
  title: z.string()
    .min(2, { message: "Title must be at least 2 characters long" })
    .transform(value => domPurify.sanitize(value.trim())),

  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .transform(value => domPurify.sanitize(value.trim())),
});

// Schema for the route params (id parameter)
export const rehabPlanCategoryParamsSchema = z.object({
  id: z.string().min(1, { message: "ID is required" })
});

// Partial update schema (user can send title, description, or both)
export const rehabPlanCategoryUpdateSchema = rehabPlanCategorySchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field (title or description) must be provided" }
  );

export type TRehabPlanCategoryRequest = z.infer<typeof rehabPlanCategorySchema>;
export type TRehabPlanCategoryParamRequest = z.infer<typeof rehabPlanCategoryParamsSchema>;
export type TRehabPlanCategoryUpdateRequest = z.infer<typeof rehabPlanCategoryUpdateSchema>;

