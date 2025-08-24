import mongoose from "mongoose";
import { TUserDocument } from "../types/user.type";
import bcrypt from 'bcrypt';
import config from "../config/config";

const userSchema = new mongoose.Schema<TUserDocument>({
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
  occupation: {
    type: String,
    trim: true
  },
  dob: {
    type: String,
    trim: true
  },
  profile_photo: {
    type: String,
    default: ''
  },
  purchasedPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RehabPlan'
  }],
  planStartDate: {
    type: Date
  },
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  // For Push Notifications
  fcmToken: {
    token: {
      type: String,
      default: null
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
    },
    deviceId: {
      type: String,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordTokenExpiresAt: {
    type: Date,
    default: null,
  }

},{
  timestamps: true
});


userSchema.pre('save', async function(next) {
  const user = this as TUserDocument;
  if(!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(Number(config.saltFactor))
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;

    next();

  } catch (error: any) {
    console.error('Failed to hash password:', error);
    next(error);
  } 
});

userSchema.methods.comparePassword = async function(candidatePassword: string) {
  const user = this as TUserDocument;

  try {
    return bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    console.error('Failed to compare passwords:', error);
    return false;
  }
};

const UserModel = mongoose.models.User || mongoose.model<TUserDocument>('User', userSchema);

export default UserModel;