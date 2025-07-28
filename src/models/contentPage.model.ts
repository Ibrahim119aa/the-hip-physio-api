const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contentPageSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true // e.g., "Privacy Policy"
  },
  // A unique, URL-friendly identifier for the page
  slug: {
    type: String,
    required: true,
    unique: true, // e.g., "privacy-policy"
    lowercase: true,
    trim: true
  },
  // The content itself, can store HTML from a rich text editor
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

const ContentPageModel = mongoose.models.ContentPage || mongoose.model('ContentPage', contentPageSchema);

export default ContentPageModel;