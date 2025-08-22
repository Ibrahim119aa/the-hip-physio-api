import { Document, Types } from 'mongoose';

export type TUser = {
  email: string;
  password: string;
  name: string;
  occupation: string;
  dob: string;
  profile_photo: string;
  purchasedPlans: Types.ObjectId[];
  planStartDate: Date | null;
  notifications: Types.ObjectId[];
  fcmToken: String | null;
  status: "active" | "inactive",
  role: 'user' | 'admin';
  resetPasswordToken: string | null,
  resetPasswordTokenExpiresAt: Date | null,
  startDate: Date;
  lastLogin: Date;
}

export type TUserDocument = TUser & Document;