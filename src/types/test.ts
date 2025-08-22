import mongoose, { Document } from "mongoose";

type TPsychologicalCheckIn = {
  userId: mongoose.Schema.Types.ObjectId;
  rehabPlanId: mongoose.Schema.Types.ObjectId;
  week: number;
  resilienceScore: number;
  comments?: string;
  exercisesCompleted?: mongoose.Schema.Types.ObjectId[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TPsychologicalCheckInDocument =  TPsychologicalCheckIn & Document;