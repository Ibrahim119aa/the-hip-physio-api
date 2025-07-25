import { Document, Types } from 'mongoose';

// Main User Document interface
export type TUser = {
  email: string;
  password: string;
  name: string;
  profile_photo: string;
  purchased_plans: Types.ObjectId[];
  notifications: Types.ObjectId[];
  streak: number;
  progress: number;
  status: "active" | "inactive",
  role: 'user' | 'admin';
  resetPasswordToken: string | null,
  resetPasswordTokenExpiresAt: Date | null,
  start_date: Date;
  last_login: Date;
}

export type TUserDocument = TUser & Document;