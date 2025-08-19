import mongoose from "mongoose";

const userNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  rehabPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  userProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProgress',
    required: true
  }
}, { timestamps: true });

const UserNoteModel = mongoose.models.UserNote || mongoose.model('UserNote', userNoteSchema);

export default UserNoteModel;