// src/models/userNotification.model.ts
import mongoose, { Schema, Types } from 'mongoose';

const userNotificationSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  notificationId:{ type: Schema.Types.ObjectId, ref: 'Notification', required: true, index: true },

  // denormalized snapshot (so UI doesn't need to re-join)
  title:        { type: String, required: true, trim: true },
  body:         { type: String, required: true, trim: true },
  data:         { type: Schema.Types.Mixed, default: {} }, // deep link params, etc.

  status:       { type: String, enum: ['unread','read','archived'], default: 'unread', index: true },
  delivered:    { type: Boolean, default: false },
  sentAt:       { type: Date, default: null },
  deliveredAt:  { type: Date, default: null },
  readAt:       { type: Date, default: null },
}, { timestamps: true });

// one copy per (user, notification)
userNotificationSchema.index({ userId: 1, notificationId: 1 }, { unique: true });
// list newest first efficiently
userNotificationSchema.index({ userId: 1, createdAt: -1 });

const UserNotificationModel = mongoose.models.UserNotification || mongoose.model('UserNotification', userNotificationSchema);

export default UserNotificationModel;
