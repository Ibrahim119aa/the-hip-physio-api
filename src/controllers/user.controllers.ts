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
import { adminUpdateUserSchema, TAdminUpdateUserRequest, TUpdateUserRequest, TUserLoginRequest, TUserRequest, updateUserSchema, userLoginSchema, userSchema } from "../validationSchemas/user.schema";
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

export const adminLoginHandler = async (
  req: Request<{}, {}, TUserLoginRequest>, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const parsedBody = userLoginSchema.safeParse(req.body);

    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map((issue: any) => issue.message);
      throw new ErrorHandler(400, `${errorMessages.join(', ')}`);
    }

    const { email, password} = parsedBody.data

    const user = await UserModel.findOne({ email });
    if (!user) throw new ErrorHandler(404, 'Invalid credentials');
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ErrorHandler(404, 'Invalid credentials');

    // Generate JWT token and save in cookies
    const token = generateTokenAndSaveCookies(
      {
        adminId: user._id, 
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

export const adminLogoutHandler = async(req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('atoken');
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('logoutHandler error', error);
    next(error)
  }
}

export const userLoginHandler = async (
  req: Request<{}, {}, TUserLoginRequest>, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const parsedBody = userLoginSchema.safeParse(req.body);

    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map((issue: any) => issue.message);
      throw new ErrorHandler(400, `${errorMessages.join(', ')}`);
    }

    const { email, password} = parsedBody.data

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
        fcmToken: user.fcmToken,
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
    
    const sentEmail = await sendNewPasswordEmailSMTP(user.email, generatedPassword, user.name);

    if (!sentEmail.ok) {
      throw new ErrorHandler(500, 'Failed to send password reset email. Please try again later.');
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('resetPasswordHandler error', error);
    next(error)
  }
}

export const getAllUsersHandler = async (req: Request, res: Response, next: NextFunction) => {
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

// GET /api/users/notifications-picklist?onlyActive=true
// Returns ALL users (for the picker) with a slim projection.
export const getUsersForNotificationsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { onlyActive = 'true' } = req.query as Record<string, string>;
    const returnOnlyActiveUsers = onlyActive === 'true';

    const matchCriteria: Record<string, unknown> = {};
    if (returnOnlyActiveUsers) matchCriteria.status = 'active';

    const projectionFields = '_id name email status';

    const usersForPicklist = await UserModel.find(matchCriteria)
      .select(projectionFields)
      .sort({ name: 1, email: 1 })
      .lean();

      if (!usersForPicklist || usersForPicklist.length === 0) {
        throw new ErrorHandler(404, 'No users found');
      }

    return res.status(200).json({
      success: true,
      message: 'Users for notifications picklist retrieved successfully',
      users: usersForPicklist,
      count: usersForPicklist.length,
    });
  } catch (error) {
    console.error('getUsersForNotificationsHandler error', error);
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
      data: {
        ...user.toObject(),
        dob: user.dob 
          ? new Date(user.dob).toISOString().split("T")[0] 
          : null
      }
    });
  } catch (error) {
    console.error('getUserProfileHandler error', error);
    next(error);
  }
}

export const updateUserProfileHandler = async(
  req: Request<{}, {}, TUpdateUserRequest>, 
  res: Response, 
  next: NextFunction
) => { 
  try {
    const parsedBody = updateUserSchema.safeParse(req.body);
    
    const userId = req.userId;
    const file = req.profileImage
    
    if(!parsedBody.success) {
      const errorMessages = parsedBody.error.issues.map((issue: any) => issue.message);
      throw new ErrorHandler(400, `${errorMessages.join(', ')}`);
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
    user.dob = parsedBody.data.dob || user.dob;
    // Save new passowrd if provided
    if(parsedBody.data.password) {
      user.password = parsedBody.data.password;
    }
    // Save FCM token if provided
    if (parsedBody.data.fcmToken) {
      user.fcmToken = parsedBody.data.fcmToken
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
    });
  } catch (error) {
    console.error('updateUserProfileHandler error', error);
    next(error);
  }
}

export const addUserByAdminHandler = async (
  req: Request<{}, {}, TUserRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Normalize client nulls -> undefined so Zod .optional() passes
    const raw = req.body as any;
    const normalized = {
      ...raw,
      occupation: raw?.occupation ?? undefined,
      dob: raw?.dob ?? undefined,
      profile_photo: raw?.profile_photo ?? undefined,
      role: raw?.role ?? "user",
      status: raw?.status ?? "active",
    };

    // Validate + sanitize
    const parsed = userSchema.safeParse(normalized);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, msg);
    }

    const { email } = parsed.data;

    // Uniqueness check (also guarded in duplicate-key catch below)
    const exists = await UserModel.findOne({ email }).select("_id").lean();
    if (exists) throw new ErrorHandler(409, "Email is already registered");

    // Build create doc (password hashing assumed in model pre-save)
    const doc: any = {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      occupation: parsed.data.occupation,
      dob: parsed.data.dob,
      profile_photo: parsed.data.profile_photo,
      status: parsed.data.status ?? "active",
      role: parsed.data.role ?? "user",
      startDate: parsed.data.startDate ?? new Date(),
      fcmToken: parsed.data.fcmToken,
    };

    if (parsed.data.purchasedPlans?.length) {
      doc.purchasedPlans = parsed.data.purchasedPlans.map(id => new Types.ObjectId(id));
    }
    if (parsed.data.notifications?.length) {
      doc.notifications = parsed.data.notifications.map(id => new Types.ObjectId(id));
    }

    const created = await UserModel.create(doc);

    // Return safe projection
    const createdSafe = await UserModel.findById(created._id)
      .select("-password")
      .lean();

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: createdSafe,
    });
  } catch (error: any) {
    // Handle unique index race
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return next(new ErrorHandler(409, "Email is already registered"));
    }
    console.error("createUserHandler error", error);
    next(error);
  }
};

export const updateUserByAdminHandler = async (
  req: Request<{ id: string }, {}, TAdminUpdateUserRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) throw new ErrorHandler(400, "Invalid user id");

    // normalize null -> undefined so .optional() passes
    const raw = req.body as Record<string, any>;
    const normalized = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === null ? undefined : v])
    );

    const parsed = adminUpdateUserSchema.safeParse(normalized);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join(", ");
      throw new ErrorHandler(400, msg);
    }
    const data = parsed.data;

    if (Object.keys(data).length === 0) {
      throw new ErrorHandler(400, "No fields provided to update");
    }

    // Ensure unique email if being changed
    if (data.email) {
      const dup = await UserModel.findOne({ email: data.email, _id: { $ne: id } })
        .select("_id")
        .lean();
      if (dup) throw new ErrorHandler(409, "Email is already registered");
    }

    const user = await UserModel.findById(id);
    if (!user) throw new ErrorHandler(404, "User not found");

    // Assign only provided fields
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.password !== undefined) user.password = data.password; // pre-save will hash
    if (data.occupation !== undefined) user.occupation = data.occupation;
    if (data.dob !== undefined) user.dob = data.dob;
    if (data.profile_photo !== undefined) user.profile_photo = data.profile_photo;
    if (data.fcmToken !== undefined) user.fcmToken = data.fcmToken;
    if (data.status !== undefined) user.status = data.status;
    if (data.role !== undefined) user.role = data.role;
    if (data.startDate !== undefined) user.startDate = data.startDate as any;
    if (data.lastLogin !== undefined) user.lastLogin = data.lastLogin as any;

    if (data.purchasedPlans !== undefined) {
      user.purchasedPlans = data.purchasedPlans.map(pid => new Types.ObjectId(pid));
    }
    if (data.notifications !== undefined) {
      user.notifications = data.notifications.map(nid => new Types.ObjectId(nid));
    }

    await user.save(); // ensures password hashing hooks run

    const safe = await UserModel.findById(id).select("-password").lean<any>();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: safe && {
        ...safe,
        dob: safe.dob ? new Date(safe.dob as any).toISOString().split("T")[0] : null,
      },
    });
  } catch (error) {
    console.error("updateUserByAdminHandler error", error);
    next(error);
  }
};

export const  deleteUserByAdminHandler = async(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) throw new ErrorHandler(400, "Invalid user id");

    const user = await UserModel.findByIdAndDelete(id);
    if (!user) throw new ErrorHandler(404, "User not found");

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("deleteUserByAdminHandler error", error);
    next(error);
  }
}
