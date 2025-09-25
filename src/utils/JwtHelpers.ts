import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Response } from 'express';

type UserTokenPayload = {
  userId: string;
  email: string;
}

type AdminTokenPayload = {
  adminId: string;
  email: string;
}

const JWT_SECRET = config.jwtSecret!;

// Generate JWT token
export const generateToken = (payload: UserTokenPayload): string => {
  const token = jwt.sign(payload, JWT_SECRET);
  return token;
};

// Generate JWT token and save as HTTP-only cookie
export const generateTokenAndSaveCookies = (
  payload: AdminTokenPayload,
  res: Response
): string => {

  const token = jwt.sign(payload, process.env.JWT_SECRET!);

  // Set HTTP-only cookie (secure, SameSite)
  res.cookie('aToken', token, {
    httpOnly: true,
    secure: config.environment === 'production', // HTTPS only in production
    // sameSite: 'lax',
    sameSite: 'none',
    path: '/', // Accessible across all routes
    maxAge: 24 * 60 * 60 * 7000, // 1 day
  });

  return token;
};


// Verify JWT token
export const verifyUserToken = (token: string): UserTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Extract token from authorization header
export const extractTokenFromHeader = (authHeader: string): string => {
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header format');
  }
  return authHeader.split(' ')[1];
};