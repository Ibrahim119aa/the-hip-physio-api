import mongoose, { Document } from "mongoose";

type TPsychologicalCheckIn = {
  userId: mongoose.Schema.Types.ObjectId;
  rehabPlanId: mongoose.Schema.Types.ObjectId;
  week: number;
  resilienceScore: number;
  comments?: string;
}

export type TPsychologicalCheckInDocument =  TPsychologicalCheckIn & Document;