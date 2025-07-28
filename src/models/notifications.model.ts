const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  targetGroup: {
    type: String,
    enum: ['All', 'Selected'],
    required: true
  },
  // Only populated if targetGroup is 'Selected'
  recipients: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledTime: {
    type: Date // For scheduling notifications in the future
  },
  sentTime: {
    type: Date // The actual time the notification was sent
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Sent', 'Failed'],
    default: 'Scheduled'
  }
}, { timestamps: true });

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default NotificationModel;