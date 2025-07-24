import mongoose from "mongoose";
import { TUserDocument } from "../types/user.type";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profile_photo: {
    type: String,
    default: ''
  },
  purchased_plans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  streak: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
// userSchema.pre('save', function(next) {
//     const user = this as TUserDocument;
//     if(!user.isModified('password')) return next();
//     try {
//       const salt = bcrypt.hash    
//     } catch (error) {

//     } 
// });

const User = mongoose.model('User', userSchema);

module.exports = User;