import Agenda from 'agenda';
import mongoose from 'mongoose';
import { defineSendNotificationJob } from './sendNotification';

// Single Agenda instance
export const agenda = new Agenda({
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
});

let initialized = false;

// Call this after your Mongoose connection is established
export async function initAgenda() {
  if (initialized) return agenda;

  if (mongoose.connection.readyState !== 1) {
    throw new Error('initAgenda called before Mongo is connected');
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongoose connected but `connection.db` is undefined');

  // Bind Agenda to the existing Db (no second connection)
  const collectionName = 'jobs_notifications';
  agenda.mongo(db, collectionName);

  // Helpful boot log
  console.log(`[Agenda] binding to db="${db.databaseName}" collection="${collectionName}"`);

  // Define jobs after binding
  defineSendNotificationJob(agenda, {});

  await agenda.start();
  initialized = true;
  console.log('🚀 [Agenda] started');

  return agenda;
}

export default agenda;
