import { Document, Types } from 'mongoose';

export type TExercise = {
  name: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  reps: string;
  sets: string;
  category: string;
  tags?: string[];
  bodyPart: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedDuration?: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TExerciseDocument = TExercise & Document;

export type TCreateExerciseInput = Omit<TExercise, 'createdAt' | 'updatedAt' | 'isActive'> & {
  isActive?: boolean;
};

export type TUpdateExerciseInput = Partial<Omit<TCreateExerciseInput, 'createdBy'>>;