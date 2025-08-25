import mongoose, { Schema, Document } from "mongoose";

export interface IContentPage extends Document {
  title: string;
  slug: string;          // e.g., 'privacy-policy', 'terms-and-conditions', 'help-faqs'
  contentHtml: string;   // sanitized HTML
  version: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContentPageSchema = new Schema<IContentPage>(
  {
    title: { type: String, required: true, trim: true },
    slug:  { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    contentHtml: { type: String, default: "" },
    version: { type: Number, default: 1 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ContentPage = mongoose.models.ContentPage || mongoose.model<IContentPage>("ContentPage", ContentPageSchema);
