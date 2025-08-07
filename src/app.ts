import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import notFoundHandler from './middlewares/notFoundHandler';
import globalErrorHandler from './middlewares/globalErrorHandler.middleware';
import config from './config/config';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import exerciseCategoriesRoutes from './routes/exerciseCategory.routes';
import rehabPlanRoutes from './routes/rehabPlan.routes';
import morgan from 'morgan';

const app = express();

app.use(morgan('dev'))

app.use(helmet());
app.use(cors({
  origin: config.crossOrigin,
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

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;