import jwt from 'jsonwebtoken';
import config from '../config/config';


type TokenPayload = {
  userId: string;
  email: string;
}

const JWT_SECRET = config.jwtSecret!; 

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
  // Token expires in 24 hours
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
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