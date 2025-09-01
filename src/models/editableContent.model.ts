import mongoose, { Schema } from "mongoose";

const EditableContentSchema = new Schema(
  {
    title: { 
      type: String, 
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
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  { timestamps: true }
);

export const EditableContentModel = mongoose.models.EditableContent || mongoose.model("EditableContent", EditableContentSchema);