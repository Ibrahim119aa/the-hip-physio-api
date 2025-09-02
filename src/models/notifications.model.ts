import mongoose, { Schema, Types } from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  body:  { type: String, required: true, trim: true },
  data:  { type: Schema.Types.Mixed },
  audienceType: { type: String, enum: ['all','selected'], required: true },
  userIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  scheduleAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  status: { type: String, enum: ['queued','scheduled','sent','failed','canceled'], default: 'queued', index: true },
  sentAt: { type: Date, default: null },
  counts: { success: { type: Number, default: 0 }, failure: { type: Number, default: 0 } },
  errorsSample: [{ code: String, msg: String }],
  deliveryLog: [{
    batchSize: Number,
    oks: Number,
    errs: [String],
  }],
}, { timestamps: true });

notificationSchema.index({ status: 1, scheduleAt: 1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });

const NotificationsModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default NotificationsModel;