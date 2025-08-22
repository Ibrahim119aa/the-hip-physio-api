import { z } from "zod";
import domPurify from "../config/domPurifyInstance";


export const userSchema = z.object({
  // --- required ---
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .transform((value) => domPurify.sanitize(value.trim())),

  email: z
    .email({ error: "Invalid email format" })
    .transform((value) => domPurify.sanitize(value.trim())),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .transform((value) => domPurify.sanitize(value.trim())),

  // --- optional (same style, no changes) ---
  occupation: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  dob: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  profile_photo: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  purchasedPlans: z.array(z.string()).optional(),     // ObjectId strings

  planStartDate: z.date().optional(),

  notifications: z.array(z.string()).optional(),      // ObjectId strings

  fcmToken: z.string()
    .nullable()
    .optional()
    .transform((value) =>
      value == null ? value : domPurify.sanitize(value.trim())
    ),

  status: z.enum(['active', 'inactive']).optional(),

  startDate: z.date().optional(),
  lastLogin: z.date().optional(),

  role: z.enum(['user', 'admin']).optional(),

  resetPasswordToken: z.string()
    .nullable()
    .optional()
    .transform((value) =>
      value == null ? value : domPurify.sanitize(value.trim())
    ),

  resetPasswordTokenExpiresAt: z.date().nullable().optional(),
});
