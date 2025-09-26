// src/validators/session.schema.ts
import { z } from "zod";
import domPurify from "../config/domPurifyInstance";

export const CreateRehabPlanEducationalVideoSchema = z.object({

    planId: z.string()
        .min(1, { message: "Rehab plan ID is required" })
        .transform((value) => domPurify.sanitize(value.trim())),
    videoId: z.array(
        z.string()
            .min(1, { message: "Educational Video ID cannot be empty" })
            .transform((value) => domPurify.sanitize(value.trim()))
    )
        .optional()
        .default([]),
});


export type TCreateRehabPlanEducationalVideoRequest = z.infer<typeof CreateRehabPlanEducationalVideoSchema>;


