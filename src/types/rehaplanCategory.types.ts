import { Document } from "mongoose"

export type TRehabPlanCategory = {
  title: string,
  description: string
}

export type TRehabPlanCategoryDocument = TRehabPlanCategory & Document;