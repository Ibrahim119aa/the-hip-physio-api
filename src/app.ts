import { agenda } from './jobs/agenda';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import notFoundHandler from './middlewares/notFoundHandler';
import globalErrorHandler from './middlewares/globalErrorHandler.middleware';
import morgan from 'morgan';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import exerciseCategoriesRoutes from './routes/exerciseCategory.routes';
import rehabPlanRoutes from './routes/rehabPlan.routes';
import sessionRoutes from './routes/session.routes';
import userProgressRoutes from './routes/userProgess.routes';
import educationalVideosRoutes from './routes/educationalVideos.routes';
import notificationRoutes from './routes/notification.routes';
import userNoteRoutes from './routes/userNote.routes';
import weeklyResilienceCheckinRoutes from './routes/weeklyPsychologicalCheckIn.routes'
import editableContentRoutes from './routes/editableConten.routes';
import defineSendNotificationJob from './jobs/sendNotification';


const app = express();

(async () => {
  defineSendNotificationJob(agenda);
  await agenda.start();
})();

app.use(morgan('dev'))

const allowedOrigins = ['https://www.thehipphysio.com', 'http://localhost:3000', 'http://localhost:3001']

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Home route
app.get("/", (req, res, next) => {
  try {
    res.status(200).json({
      message: "Welcome to The Hip Physio"
    })
  } catch (error) {
    next(error)
  }
});

// routes
app.use('/api/user', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/exercise-categories', exerciseCategoriesRoutes);
app.use('/api/rehab-plans', rehabPlanRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/user-progress', userProgressRoutes);
app.use('/api/educational-videos', educationalVideosRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/user-notes', userNoteRoutes)
app.use('/api/weekly-resilience-checkin', weeklyResilienceCheckinRoutes)
app.use('/api/editable-content', editableContentRoutes)

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;