import { NextFunction, Request, Response } from "express";
import UserModel from "../models/user.model";
import createPassword from "../utils/createPassword";
import Stripe from "stripe";
import config from "../config/config";
import { TUserDocument } from "../types/user.type";
import { Types } from "mongoose";
import { sendAccountCredentialsEmail } from "../mailtrap/emails/sendAccountCredentialsEmail";
import { dummyStripeEvent } from "../utils/DummyData";
import ErrorHandler from "../utils/errorHandlerClass";
import { sendNewPasswordEmailSMTP  } from "../mailtrap/emails/sendPasswordResetEmail";
import { generateToken, generateTokenAndSaveCookies } from "../utils/JwtHelpers";
import bcrypt from 'bcrypt';
import { TUpdateUserRequest, updateUserSchema } from "../validationSchemas/user.schema";
import { uploadProfileImageToCloudinary } from "../utils/cloudinaryUploads/uploadProfileImageToCloudinary";

// import { sendPasswordResetEmailSMTP } from "../mailtrap/emails/sendPasswordResetEmail";


// const stripe = new Stripe(config.stripeSecretKey!, {
//   apiVersion: '2025-06-30.basil',
//   timeout: 8000,
//   maxNetworkRetries: 2
// });
// const endpointSecret = config.stripeEndpointSecret!;

// export const stripeWebhookAndCreateCredentialHandler = async (
//   req: Request, 
//   res: Response, 
//   next: NextFunction
// ) => {
//   const sig = req.headers['stripe-signature'] as string;
//   const buf = req.body as Buffer;

//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
//   } catch (error: any) {
//     console.error('Webhook signature verification failed:', error.message);
//     return res.status(400).send(`Webhook Error: ${error.message}`);
//   }

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed':
//         const session = event.data.object as Stripe.Checkout.Session;

//         // Extract Data
//         const email = session.customer_details?.email;
//         const name = session.customer_details?.name || "Customer";
//         const planId = session.metadata?.rehab_plan_id;
//         const rehabPlan = session.metadata?.rehab_plan_name || "Rehab Plan";

//         // Validate required fields
//         if (!email || !planId) {
//           return res.status(400).send("Missing email or planId");
//         }

//         // Validate planId format      
//         const planIdObject = new Types.ObjectId(planId);
//         const existingUser = await UserModel.findOne<TUserDocument>({ email });

//         if (existingUser) {
//           // Update existing user if plan not already added
//           if (!existingUser.purchasedPlans.includes(planIdObject)) {
//             existingUser.purchasedPlans.push(planIdObject);
//             await existingUser.save();
//           }
//           return res.status(200).json({
//             success: true,
//             message: 'Plan added to existing user'
//           });
//         } else {
//           // Create NEW USER with required name field
//           const generatedPassword = createPassword();
          
//           const newUser = new UserModel({
//             email,
//             name,
//             password: generatedPassword,
//             purchased_plans: [planIdObject],
//             status: 'active',
//           });

//           await newUser.save();

//           // Send credentials via secure email
//           await sendAccountCredentialsEmail(
//             email, 
//             name, 
//             generatedPassword, 
//             rehabPlan, 
//             config.iosAppLink, 
//             config.androidAppLink
//           )

//           return res.status(201).json({
//             success: true,
//             message: 'User created and credentials sent'
//           });
//         }

//       default:
//         console.log(`Unhandled event type ${event.type}`);
//         return res.status(200).json({ received: true }); // Acknowledge event
//     }
//   } catch (error) {
//     console.error('Error in webhook handler:', error);
//     return res.status(500).send('Internal Server Error');
//   }
// };

export const stripeWebhookAndCreateCredentialHandlerTemporary = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try { 
    const session = dummyStripeEvent.data.object;
    
    // Extract Data
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "Customer";
    const planId = session.metadata?.rehab_plan_id;
    // const rehabPlan = session.metadata?.rehab_plan_name || "Rehab Plan";

    // Validate required fields
    if (!email || !planId) {
      return res.status(400).send("Missing email or planId");
    }

    // Validate planId format      
    const planIdObject = new Types.ObjectId(planId);
    const existingUser = await UserModel.findOne<TUserDocument>({ email });

    if (existingUser) {
      // Update existing user if plan not already added
      if (!existingUser.purchasedPlans.includes(planIdObject)) {
        existingUser.purchasedPlans.push(planIdObject);
        await existingUser.save();
      }
      return res.status(200).json({
        success: true,
        message: 'Plan added to existing user'
      });
    } else {
      // Create NEW USER with required name field
      const generatedPassword = createPassword();
      console.log('generatedPassword', generatedPassword);
      
      const newUser = new UserModel({
        email,
        name,
        password: generatedPassword,
        purchasedPlans: [planIdObject],
        status: 'active',
      });

      await newUser.save();

      // Send credentials via secure email
      // await sendAccountCredentialsEmail(
      //   email, 
      //   name, 
      //   generatedPassword, 
      //   rehabPlan, 
      //   config.iosAppLink, 
      //   config.androidAppLink
      // );

      return res.status(201).json({
        success: true,
        message: 'User created and credentials sent'
      });
    }
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return res.status(500).send('Internal Server Error');
  }
};

export const adminLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
        
    if (!email || !password) {
      throw new ErrorHandler(400, 'Email and password are required');
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new ErrorHandler(404, 'Invalid credentials');
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ErrorHandler(404, 'Invalid credentials');

    // Generate JWT token and save in cookies
    const token = generateTokenAndSaveCookies(
      {
        userId: user._id, 
        email: user.email,
      }, 
      res
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        purchasedPlans: user.purchasedPlans,
        status: user.status
      }
    });

  } catch (error) {
    console.error('loginHandler error', error);
    next(error)
  }
}

export const userLoginHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    console.log('email', email);
    console.log('password', password);
    
    
    
    if (!email || !password) {
      throw new ErrorHandler(400, 'Email and password are required');
    }

    const user = await UserModel.findOne({ email });
    if (!user) throw new ErrorHandler(404, 'Invalid credentials');
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ErrorHandler(404, 'Invalid credentials');

    // Generate JWT token
    const token = generateToken({
      userId: user._id, 
      email: user.email
    });
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        purchasedPlans: user.purchasedPlans,
        status: user.status
      }
    });

  } catch (error) {
    console.error('loginHandler error', error);
    next(error)
  }
}

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) throw new ErrorHandler(400, 'Email is required');

    // Find user and handle not found
    const user = await UserModel.findOne({ email });

    if (!user) throw new ErrorHandler(404, 'User not found');

    // Generate and set new password
    const generatedPassword = createPassword();

    // save new password
    user.password = generatedPassword;
    await user.save();
    
    await sendNewPasswordEmailSMTP(user.email, generatedPassword, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('resetPasswordHandler error', error);
    next(error)
  }
}

// Admin role management functions
export const assignAdminRoleHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) throw new ErrorHandler(400, 'User ID is required');
    if (!role || !['user', 'admin'].includes(role)) {
      throw new ErrorHandler(400, 'Valid role (user or admin) is required');
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) throw new ErrorHandler(404, 'User not found');

    // Update role
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`,
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('assignAdminRoleHandler error', error);
    next(error);
  }
};

export const getUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, role, status } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    
    const users = await UserModel.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await UserModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit)
      }
    });

  } catch (error) {
    console.error('getUsersHandler error', error);
    next(error);
  }
};

export const createFirstAdminHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      throw new ErrorHandler(400, 'Email, name, and password are required');
    }

    // Check if any admin already exists
    const existingAdmin = await UserModel.findOne({ role: 'admin' });
    if (existingAdmin) {
      throw new ErrorHandler(409, 'Admin already exists. Cannot create first admin.');
    }

    // Check if user with email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ErrorHandler(409, 'User with this email already exists');
    }

    // Create first admin
    const adminUser = new UserModel({
      email,
      name,
      password,
      role: 'admin',
      status: 'active'
    });

    await adminUser.save();

    // Generate JWT token
    const token = generateToken({
      userId: adminUser._id,
      email: adminUser.email
    });

    res.status(201).json({
      success: true,
      message: 'First admin created successfully',
      token,
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      }
    });

  } catch (error) {
    console.error('createFirstAdminHandler error', error);
    next(error);
  }
};

// USER PROFILE HANDLERS

export const getUserProfileHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ErrorHandler(400, 'User ID is required');
    }

    const user = await UserModel.findById(userId)
      .select('-password') // Exclude password from response
      .populate('purchasedPlans', 'name price') // Populate purchased plans with name and price
      .populate('notifications', 'message createdAt'); // Populate notifications

    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getUserProfileHandler error', error);
    next(error);
  }
}

export const updateUserProfileHandler = async(req: Request<{}, {}, TUpdateUserRequest>, res: Response, next: NextFunction) => {
  console.log('req.body', req.body);
  
  try {
    const parsedBody = updateUserSchema.safeParse(req.body);
    const userId = req.userId;
    const file = req.profileImage
    console.log('file', file);
    console.log('parsedBody', parsedBody);
      

    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map((issue: any) => issue.message);
      throw new ErrorHandler(400, `Invalid request data: ${errorMessages.join(', ')}`);
    }
    
    if (!userId) throw new ErrorHandler(400, 'User ID is required');

    const user = await UserModel.findById(userId).select('-password');

    if (!user) throw new ErrorHandler(404, 'User not found');

    if(file) {
      const uploadImage = uploadProfileImageToCloudinary(file);
      user.profile_photo = await uploadImage;
    }

    // Update user profile
    user.name = parsedBody.data.name || user.name;
    user.occupation = parsedBody.data.occupation || user.occupation;
    user.dob = parsedBody.data.dob || user.dob;;
    if(parsedBody.data.password) {
      user.password = parsedBody.data.password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      // data: user
    });
  } catch (error) {
    console.error('updateUserProfileHandler error', error);
    next(error);
  }
}
