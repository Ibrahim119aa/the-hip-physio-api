import mongoose, { Schema } from "mongoose";


export interface IContentPage extends Document {
  title: string;
  slug: string;          // e.g., 'privacy-policy', 'terms-and-conditions', 'help-faqs'
  contentHtml: string;   // sanitized HTML
  version: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: Schema.Types.ObjectId;
}


const EditableContentSchema = new Schema<IContentPage>(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    slug:  { 
      type: String, 
      required: true, 
      unique: true, 
      index: true, 
      lowercase: true, 
      trim: true 
    },
    contentHtml: { 
      type: String, 
      required: true 
    },
    // version: { 
    //   type: Number, 
    //   default: 1 
    // },
    // published: { 
    //   type: Boolean, 
    //   default: true 
    // },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  { timestamps: true }
);

export const EditableContentModel = mongoose.models.ContentPage || mongoose.model<IContentPage>("EditableContent", EditableContentSchema);