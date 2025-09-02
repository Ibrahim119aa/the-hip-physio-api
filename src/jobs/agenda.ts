// import Agenda from 'agenda';
// import config from '../config/config';

// const mongoUrl = config.mongoURI as string;

// export const agenda = new Agenda({
//   db: { address: mongoUrl, collection: 'jobs_notifications' },
//   defaultLockLifetime: 10 * 60 * 1000, // 10m
// });


// src/jobs/agenda.ts
import Agenda from 'agenda';
import config from '../config/config';
import { defineSendNotificationJob } from './sendNotification';

const mongoUrl = config.mongoURI as string;

export const agenda = new Agenda({
  db: { address: mongoUrl, collection: 'jobs_notifications' },
  defaultLockLifetime: 10 * 60 * 1000, // 10m
});

// Define jobs ONCE, right after constructing Agenda.
// Android-only for now: either pass a channel id, or omit it.
defineSendNotificationJob(agenda, {
  // If your app created a channel, set it via env and pass it here:
  // androidChannelId: process.env.ANDROID_CHANNEL_ID,
  // If you don't know the channel yet, just leave it out and the app will use a fallback channel.
});

export default agenda;
