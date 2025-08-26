import mongoose from "mongoose";

const userNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rehabPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  userProgress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProgress',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
}, { timestamps: true });

userNoteSchema.index({ user: 1, rehabPlan: 1, session: 1 }, { unique: true });

const UserNoteModel = mongoose.models.UserNote || mongoose.model('UserNote', userNoteSchema);

export default UserNoteModel;