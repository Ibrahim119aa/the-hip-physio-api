import express, { urlencoded } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import notFoundHandler from './middlewares/notFoundHandler';
import globalErrorHandler from './middlewares/globalErrorHandler.middleware';
import config from './config/config';
import userRoutes from './routes/user.routes';

const app = express();

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
      message: "Wellcome to The Hip Physio"
    })
  } catch (error) {
    next(error)
  }
});

// routes
app.use('/api/user', userRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;