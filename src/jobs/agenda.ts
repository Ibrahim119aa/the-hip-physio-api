import Agenda from 'agenda';
import config from '../config/config';

const mongoUrl = config.mongoURI as string;

export const agenda = new Agenda({
  db: { address: mongoUrl, collection: 'jobs_notifications' },
  defaultLockLifetime: 10 * 60 * 1000, // 10m
});
