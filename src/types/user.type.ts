import { Document, Types } from 'mongoose';

// Main User Document interface
export type TUser = {
  email: string;
  password: string;
  name: string;
  profile_photo: string;
  purchased_plans: Types.ObjectId[]; // Array of ObjectIds (ref: 'Plan')
  notifications: Types.ObjectId[]; // Array of ObjectIds (ref: 'Notification')
  streak: number;
  progress: number;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export type TUserDocument = TUser & Document;