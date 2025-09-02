import { z } from "zod";
import domPurify from "../config/domPurifyInstance";


export const userSchema = z.object({
  // --- required ---
  name: z.string()
    .min(1, 'Name is required')
    .max(20, 'Name must be less than 20 characters')
    .transform((value) => domPurify.sanitize(value.trim())),

  email: z.email({ error: "Invalid email format" })
    .transform((value) => value.trim().toLowerCase()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must be less than 20 characters'),

  // --- optional ---
  occupation: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  dob: z.coerce
    .date({ message: "Invalid date of birth format use (YYYY-MM-DD)" })
    .max(new Date(), { message: "DOB cannot be in the future" })
    .optional(),

  profile_photo: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  purchasedPlans: z.array(z.string()).optional(),
  notifications: z.array(z.string()).optional(),
  fcmToken: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  startDate: z.date().optional(),
  lastLogin: z.date().optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(20, 'Name must be less than 20 characters')
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must be less than 20 characters')
    .optional(),
  
  occupation: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  dob: z.coerce
    .date({ message: "Invalid date of birth format use (YYYY-MM-DD)" })
    .max(new Date(), { message: "DOB cannot be in the future" })
    .optional(),

  profile_photo: z.string()
    .optional()
    .transform((value) => value === undefined ? value : domPurify.sanitize(value.trim())),

  fcmToken: z.string().optional(),
}).strict();

export const userLoginSchema = z.object({
  email: z.email({ error: "Invalid email format" })
    .transform((value) => value.trim().toLowerCase()),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password must be less than 20 characters')
}); 

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const adminUpdateUserSchema = updateUserSchema.extend({
  // admins may also change email, status, role, plan refs, etc.
  email: z.email({ error: "Invalid email format" })
    .transform(v => v.trim().toLowerCase())
    .optional(),

  status: z.enum(["active", "inactive"]).optional(),
  role: z.enum(["user", "admin"]).optional(),

  purchasedPlans: z.array(objectId).optional(),
  notifications: z.array(objectId).optional(),

  startDate: z.coerce.date().optional(),
  lastLogin: z.coerce.date().optional(),
});


export type TUserRequest = z.infer<typeof userSchema>;
export type TUpdateUserRequest = z.infer<typeof updateUserSchema>;
export type TUserLoginRequest = z.infer<typeof userLoginSchema>;
export type TAdminUpdateUserRequest = z.infer<typeof adminUpdateUserSchema>;

