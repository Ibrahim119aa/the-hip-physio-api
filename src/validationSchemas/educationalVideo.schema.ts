import { z } from "zod";
import domPurify from "../config/domPurifyInstance";

export const educationVideoSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .transform(value => domPurify.sanitize(value.trim())),

  description: z.string()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters")
    .transform(value => domPurify.sanitize(value.trim())),

  category: z.string()
    .min(1, "Category is required")
    .transform(value => domPurify.sanitize(value.trim())),

  tags: z.array(
    z.string()
      .min(1, "Tag cannot be empty")
      .transform(value => domPurify.sanitize(value.trim()))
  ).optional(),
});

export type TEducationVideoRequest = z.infer<typeof educationVideoSchema>;