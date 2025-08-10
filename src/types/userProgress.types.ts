import { Document, Types } from 'mongoose';

type CompletedExercise = {
  exerciseId: Types.ObjectId;
  irritabilityScore?: number; 
  completedAt?: Date;         
};

type CompletedSession = {
  sessionId: Types.ObjectId;
  difficultyRating?: 'too easy' | 'just right' | 'too hard';
  completedAt?: Date;
};

export type TUserProgress = {
  userId: Types.ObjectId;
  rehabPlanId: Types.ObjectId;
  
  completedExercises: CompletedExercise[];
  completedSessions: CompletedSession[];
  
  currentWeek: number;
  currentDay: number;
  progressPercent: number;
  resiliencyScore: number;
  streakCount: number;
  lastUpdated: Date;
}

export type TUserProgressDocument = TUserProgress & Document;
