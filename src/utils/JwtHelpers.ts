import jwt from 'jsonwebtoken';
import config from '../config/config';
import { Response } from 'express';

type TokenPayload = {
  userId: string;
  email: string;
}

const JWT_SECRET = config.jwtSecret!; 

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
  const token = jwt.sign(payload, JWT_SECRET);
  return token;
};

// Generate JWT token and save as HTTP-only cookie
export const generateTokenAndSaveCookies = (
  payload: TokenPayload,
  res: Response
): string => {
  
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });

  // Set HTTP-only cookie (secure, SameSite)
  res.cookie('aToken', token, {
    httpOnly: true,
    secure: config.environment === 'production', // HTTPS only in production
    sameSite: 'lax', // or 'lax' for cross-site compatibility
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    path: '/', // Accessible across all routes
  });

  return token;
};


// Verify JWT token
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
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