import z from "zod";
import domPurify from "../config/domPurifyInstance";


export const EducationalVideoCategoryParamsSchema = z.object({
  id: z
    .string()
    .min(1, { message: "ID is required" })
    .transform((value) => domPurify.sanitize(value.trim())),
});

export const CreateEducationalVideoCategorySchema = z.object({
  title: z.string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50)
    .transform(value => domPurify.sanitize(value.trim())),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(500)
    .transform(value => domPurify.sanitize(value.trim())),
});

export const UpdateEducationalVideoCategorySchema  = z.object({
  title: z.string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(50)
    .optional()
    .transform(value => value === undefined ? value:  domPurify.sanitize(value.trim())),
  description: z.string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(500)
    .optional()
    .transform(value => value === undefined ? value:  domPurify.sanitize(value.trim())),
});

export type TEducationalVideoCategoryParams = z.infer<typeof EducationalVideoCategoryParamsSchema>;
export type TCreateEducationalVideoCategoryRequest = z.infer<typeof CreateEducationalVideoCategorySchema>;
export type TUpdateEducationalVideoCategoryRequest = z.infer<typeof UpdateEducationalVideoCategorySchema>;