import Agenda from 'agenda';
import config from '../config/config';
import { defineSendNotificationJob } from './sendNotification';
import mongoose from 'mongoose';
import { database } from '../config/dataBase';

// const mongoUrl = config.mongoURI as string;

// export const agenda = new Agenda({
//   db: { address: mongoUrl, collection: 'jobs_notifications' },
//   defaultLockLifetime: 10 * 60 * 1000, // 10m
// });

// // Define jobs ONCE, right after constructing Agenda.
// // Android-only for now: either pass a channel id, or omit it.
// defineSendNotificationJob(agenda, {
//   // If your app created a channel, set it via env and pass it here:
//   // androidChannelId: process.env.ANDROID_CHANNEL_ID,
//   // If you don't know the channel yet, just leave it out and the app will use a fallback channel.
// });

export const agenda = new Agenda({
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
});

// Call this from your app bootstrap *after* database.connect()
export async function initAgenda() {
  // Ensure DB connection is established via your Database class
  if (mongoose.connection.readyState !== 1) {
    await database.connect(); // ← ensures your own logs fire
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongoose connected but `connection.db` is undefined');

  // Bind Agenda to the existing Db (sync)
  agenda.mongo(db, 'jobs_notifications');

  // Define jobs after binding
  defineSendNotificationJob(agenda, {
    //   // If your app created a channel, set it via env and pass it here:
    //   // androidChannelId: process.env.ANDROID_CHANNEL_ID,
    //   // If you don't know the channel yet, just leave it out and the app will use a fallback channel.
  });

  await agenda.start();
}

export default agenda;
