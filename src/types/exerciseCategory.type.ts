import { Document } from "mongoose"

export type TExerciseCategory = {
  title: string,
  description: string
}

export type TExerciseCategoryDocument = TExerciseCategory & Document;