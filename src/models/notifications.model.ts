import mongoose, { Schema, Types } from "mongoose";

// // const notificationSchema = new Schema({
// //   title: {
// //     type: String,
// //     required: true
// //   },
// //   body: {
// //     type: String,
// //     required: true
// //   },
// //   targetGroup: {
// //     type: String,
// //     enum: ['All', 'Segment', 'SelectedUsers'], // More descriptive enum
// //     required: true
// //   },
// //   // Used if targetGroup is 'Segment' (e.g., 'pro_plan', 'new_users')
// //   targetSegment: {
// //     type: String
// //   },
// //   // Used if targetGroup is 'SelectedUsers'
// //   recipients: [{
// //     type: Schema.Types.ObjectId,
// //     ref: 'User'
// //   }],
// //   // For deep-linking or passing extra info to the app
// //   data: {
// //     type: Object 
// //   },
// //   scheduledTime: {
// //     type: Date
// //   },
// //   sentTime: {
// //     type: Date
// //   },
// //   status: {
// //     type: String,
// //     enum: ['Scheduled', 'Sent', 'Failed'],
// //     default: 'Scheduled',
// //     index: true // Good to index status for faster querying by your scheduler
// //   },
// //   // To log any sending errors
// //   error: {
// //     type: String
// //   }
// // }, { timestamps: true });

// // const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// // export default NotificationModel;

// // export type AudienceType = "all" | "segment" | "users";

// // export type NotificationAttrs {
// //   title: string;
// //   body: string;
// //   imageUrl?: string;
// //   data?: Record<string, any>;        // Deep linking data
// //   audienceType: AudienceType;
// //   userIds?: Types.ObjectId[];        // When audienceType === 'users'
// //   segment?: {
// //     status?: "active" | "inactive";
// //     planId?: Types.ObjectId;         // Users with specific plan
// //     role?: "user" | "admin";
// //     lastLoginBefore?: Date;          // Users inactive since date
// //     registeredAfter?: Date;          // New users since date
// //     hasCompletedWorkouts?: boolean;  // Users based on activity
// //   };
// //   scheduleAt?: Date | null;          // null = send immediately
// //   createdBy: Types.ObjectId;         // Admin who created
// //   status?: "draft" | "scheduled" | "sending" | "sent" | "failed";
// //   sentAt?: Date | null;
// //   deliveryStats?: {
// //     totalTargeted: number;
// //     successful: number;
// //     failed: number;
// //     pending: number;
// //   };
// //   error?: string | null;
// //   priority?: "high" | "normal" | "low"; // FCM priority
// // }

// const notificationSchema = new mongoose.Schema({
//   title: { 
//     type: String, 
//     required: true, 
//     trim: true, 
//     maxlength: 100 
//   },
//   body: { 
//     type: String, 
//     required: true, 
//     trim: true, 
//   },
//   data: { 
//     type: Schema.Types.Mixed 
//   },
//   audienceType: { 
//     type: String, 
//     enum: ['all','selected'],
//     required: true,
//   },
//   userIds: [{ 
//     type: Schema.Types.ObjectId, 
//     ref: "User" 
//   }], // when target = selected
//   // segment: {
//   //   status: { type: String, enum: ["active", "inactive"] },
//   //   planId: { type: Schema.Types.ObjectId, ref: "RehabPlan" },
//   //   role: { type: String, enum: ["user", "admin"] },
//   //   lastLoginBefore: { type: Date },
//   //   registeredAfter: { type: Date },
//   //   hasCompletedWorkouts: { type: Boolean }
//   // },
//   // scheduleAt: { 
//   //   type: Date, 
//   //   default: null, 
//   //   index: true 
//   // },
  
//   scheduleAt: { type: Date }, // null/undefined = send now
//   createdBy: { 
//     type: Schema.Types.ObjectId, 
//     ref: "Admin", 
//   },
//   status: { 
//     type: String,  
//     enum: ['queued','scheduled','sent','failed','canceled'],
//     default: 'queued',
//     index: true 
//   },
//   sentAt: { 
//     type: Date, 
//     default: null 
//   },
//   counts: {
//     success: { type: Number, default: 0 },
//     failure: { type: Number, default: 0 }
//   },
//   // deliveryStats: {
//   //   totalTargeted: { type: Number, default: 0 },
//   //   successful: { type: Number, default: 0 },
//   //   failed: { type: Number, default: 0 },
//   //   pending: { type: Number, default: 0 }
//   // // },
//   // error: { type: String, default: null },
//   // priority: { type: String, enum: ["high", "normal", "low"], default: "normal" },
//    errorsSample: [{ code: String, msg: String }], // keep small sample for debugging
// }, { 
//   timestamps: true
// });

// // Indexes for performance
// notificationSchema.index({ status: 1, scheduleAt: 1 }); // For scheduler queries
// notificationSchema.index({ createdBy: 1, createdAt: -1 }); // For admin dashboard

// const NotificationsModel =  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

// export default NotificationsModel;


// models/notifications.model.ts
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
