// schemas/rehabPlan.schemas.ts
import { z } from "zod";
import domPurify from "../config/domPurifyInstance";

export const createRehabPlanPhaseSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(100)
    .transform((value) => domPurify.sanitize(value.trim())),

  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000)
    .transform((value) => domPurify.sanitize(value.trim())),

  price: z.coerce.number().min(0),
  planType: z.enum(["paid", "free"]),
  planDurationInWeeks: z.coerce.number().int().min(1),

  // number or null; 0 is allowed
  weekStart: z.coerce.number().int().min(0).or(z.null()).default(null),
  weekEnd: z.coerce.number().int().min(0).or(z.null()).default(null),
  openEnded: z.coerce.boolean().default(false),

  phase: z.string()
    .max(100)
    .transform((value) => domPurify.sanitize(value.trim()))
    .nullable()
    .default(null),

  category: z.array(z.string()).min(1, { message: "Select at least one category" }),
  
});

/** PARAM: /:planId */
export const planIdParamSchema = z.object({
  planId: z.string(),
});

/** Update Plan schema */
export const updateRehabPlanSchema = z.object({

  name: z.string()
    .min(3)
    .max(100)
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim()))
    .optional(),
  
  description: z.string()
    .min(10)
    .max(5000)
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim()))
    .optional(),
  
  price: z.coerce.number().min(0).optional(),

  planType: z.enum(["paid", "free"]).optional(),
  
  planDurationInWeeks: z.coerce.number()
    .int()
    .min(1)
    .optional(),
  
  weekStart: z.coerce.number()
    .int()
    .min(0)
    .nullable()
    .optional(),
  
  weekEnd: z.coerce.number()
    .int()
    .min(0)
    .nullable()
    .optional(),
  
  openEnded: z.coerce.boolean().optional(),
  
  phase: z.string()
    .max(100)
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim()))
    .nullable()
    .optional(),
  
  category: z.array(z.string())
    .min(1)
    .optional(),

  // Schedule (optional; supply only if you’re updating schedule)
  schedule: z.array(
    z.object({
      week: z.coerce.number().int().min(0),
      day: z.coerce.number().int().min(1).max(7),
      sessions: z.array(z.string()).min(1),
    })
  )
  .min(1)
  .optional(),
  
})

// Types
export type TRehabPlanCreateRequest = z.infer<typeof createRehabPlanPhaseSchema>;
export type TPlanIdParams = z.infer<typeof planIdParamSchema>;
export type TUpdateRehabPlanRequest = z.infer<typeof updateRehabPlanSchema>;