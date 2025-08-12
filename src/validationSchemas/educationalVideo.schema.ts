import { z } from "zod";

export const educationVideoSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),

  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters"),

  category: z.array(
    z.string().min(1, "Category cannot be empty")
  ).nonempty("At least one category is required"),

  tags: z.array(
    z.string().min(1, "Tag cannot be empty")
  ).nonempty("At least one tag is required"),
});

// Type for TypeScript usage
export type TEducationVideoRequest = z.infer<typeof educationVideoSchema>;