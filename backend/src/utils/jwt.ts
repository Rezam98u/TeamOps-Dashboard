import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const accessTokenPayload: AccessTokenPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(accessTokenPayload, process.env['JWT_ACCESS_SECRET']!, {
    expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const refreshTokenPayload: RefreshTokenPayload = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(refreshTokenPayload, process.env['JWT_REFRESH_SECRET']!, {
    expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, process.env['JWT_ACCESS_SECRET']!) as AccessTokenPayload;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (_error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, process.env['JWT_REFRESH_SECRET']!) as RefreshTokenPayload;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (_error) {
    throw new Error('Invalid refresh token');
  }
};
