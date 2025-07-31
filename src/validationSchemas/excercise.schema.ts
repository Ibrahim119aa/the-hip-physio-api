// import z from "zod"
// export const exerciseSchema = z.object({
//   body: z.object({
//     name: z.string().min(3, "name is required").max(50),
//     description: z.string().min(10, "description is required").max(500),
//     reps: z.number().min(1, "reps are required").max(100),
//     sets: z.number().min(1, "sets are required").max(100),
//     category: z.string().min(3, "category is required").max(50),
//     bodyPart: z.string().min(3, "body part category is required").max(50),
//     tags: z.array(z.string()).optional(),
//     difficulty: z.string().min(3).max(50).optional(),
//     estimatedDuration: z.number().min(1).max(100).optional(),
//   })
// })

import z from "zod";

export const createExerciseSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50),
    description: z.string().min(10, "Description must be at least 10 characters").max(500),
    videoUrl: z.string().url("Invalid video URL").min(1, "Video URL is required"),
    thumbnailUrl: z.string().url("Invalid thumbnail URL").optional(),
    reps: z.string().min(1, "Reps are required"), // Changed to string to match Mongoose
    sets: z.string().min(1, "Sets are required"), // Changed to string to match Mongoose
    category: z.string().min(3, "Category must be at least 3 characters").max(50),
    bodyPart: z.string().min(3, "Body part must be at least 3 characters").max(50),
    tags: z.array(z.string().min(1)).optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
    estimatedDuration: z.number().min(1).max(300).optional(), // Assuming max 300 minutes (5 hours)
  })
});

// Type export for TypeScript
export type ExerciseInput = z.infer<typeof createExerciseSchema>;