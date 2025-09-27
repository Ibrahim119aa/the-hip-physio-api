import express from 'express';
import helmet from 'helmet';
import { Types } from 'mongoose';
import UserModel from './models/user.model';
import { TUserDocument } from './types/user.type';
import cors from 'cors';
import config from './config/config';
import createPassword from './utils/createPassword';
import cookieParser from 'cookie-parser';
import notFoundHandler from './middlewares/notFoundHandler';
import globalErrorHandler from './middlewares/globalErrorHandler.middleware';
import morgan from 'morgan';
import { sendAccountCredentialsEmail } from './mailtrap/emails/sendAccountCredentialsEmail';
import userRoutes from './routes/user.routes';
import exerciseRoutes from './routes/exercise.routes';
import exerciseCategoriesRoutes from './routes/exerciseCategory.routes';
import rehabPlanRoutes from './routes/rehabPlan.routes';
import sessionRoutes from './routes/session.routes';
import userProgressRoutes from './routes/userProgess.routes';
import educationalVideosRoutes from './routes/educationalVideos.routes';
import notificationRoutes from './routes/notification.routes';
import weeklyResilienceCheckinRoutes from './routes/weeklyPsychologicalCheckIn.routes'
import editableContentRoutes from './routes/editableConten.routes';
import dashboardRouter from './routes/dashboard.routes';
import userNotificationsRoutes from './routes/userNotifications.routes';
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const app = express();

app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string | undefined;

    if (!sig) {
      return res.status(400).send("Missing Stripe-Signature header");
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    console.log("this is session data ");

    // console.log("✅ Event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("this is session data ");
      console.log(session);
      const email = session.customer_details?.email;
      const name = session.customer_details?.name || "Customer";
      const planId = session.metadata?.rehab_plan_id;
      const rehabPlan = session.metadata?.rehab_plan_name || "Rehab Plan";
      if (!email || !planId) {
        console.log("Missing email or planId");
        return res.status(400).send("Missing email or planId");
      }

      // Validate planId format      
      const planIdObject = new Types.ObjectId(planId);
      console.log("this is plan object");
      console.log(planIdObject);
      const existingUser = await UserModel.findOne<TUserDocument>({ email });
      if (existingUser) {
        console.log("this is existing user");
        console.log(existingUser);
        // Update existing user if plan not already added
        if (!existingUser.purchasedPlans.includes(planIdObject)) {
          existingUser.purchasedPlans.push(planIdObject);
          await existingUser.save();
        }
        return res.status(200).json({
          success: true,
          message: 'Plan added to existing user'
        });
      }
      else {
        // Create NEW USER with required name field
        const generatedPassword = createPassword();

        const newUser = new UserModel({
          email,
          name,
          password: generatedPassword,
          purchasedPlans: [planIdObject],
          status: 'active',
        });

        await newUser.save();

        // Send credentials via secure email
        await sendAccountCredentialsEmail(
          email,
          name,
          generatedPassword,
          rehabPlan,
          config.iosAppLink,
          config.androidAppLink
        )

        return res.status(201).json({
          success: true,
          message: 'User created and credentials sent'
        });
      }
    }
  }
);
app.use(morgan('dev'))

const allowedOrigins = ['https://www.thehipphysio.com', 'http://127.0.0.1:5500', 'https://thehipphysio-6d2j.vercel.app', 'http://localhost:3000', 'http://localhost:3001']

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/weekly-resilience-checkin', weeklyResilienceCheckinRoutes)
app.use('/api/editable-content', editableContentRoutes)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/me', userNotificationsRoutes)

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;