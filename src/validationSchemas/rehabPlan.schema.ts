// schemas/rehabPlan.schemas.ts
import { z } from "zod";
import domPurify from "../config/domPurifyInstance";


export const createRehabPlanPhaseSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(100)
    .transform(v => domPurify.sanitize(v.trim())),

  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(5000)
    .transform(v => domPurify.sanitize(v.trim())),

  planType: z.enum(["paid", "free"]),

  // now optional at the base level
  price: z.coerce.number().min(0).optional(),

  // optional if openEnded=true
  planDurationInWeeks: z.coerce.number().int().min(1).optional(),

  // optional/nullable
  weekStart: z.coerce.number().int().min(0).nullable().optional(),
  weekEnd: z.coerce.number().int().min(0).nullable().optional(),

  openEnded: z.coerce.boolean().default(false),

  phase: z.string()
    .max(100)
    .transform(v => domPurify.sanitize(v.trim()))
    .nullable()
    .optional(),

  // allow empty list (or make it conditional if you prefer)
  category: z.array(z.string()).default([]).optional(),
  equipment: z.array(z.string()).default([]).optional(),
})
  .superRefine((data, ctx) => {
    // price required only for paid plans
    if (data.planType === "paid" && (data.price == null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["price"], message: "Price is required for paid plans" });
    }

    // duration required unless openEnded
    if (!data.openEnded && (data.planDurationInWeeks == null)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["planDurationInWeeks"], message: "Plan duration is required unless the plan is open-ended" });
    }

    // optional: only paid plans require at least one category
    // if (data.planType === "paid" && (!data.category || data.category.length === 0)) {
    //   ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["category"], message: "Select at least one category for paid plans" });
    // }

    // sanity: if both set, end >= start
    if (data.weekStart != null && data.weekEnd != null && data.weekEnd < data.weekStart) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["weekEnd"], message: "Week End must be greater than or equal to Week Start" });
    }
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
  equipment: z.array(z.string())
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