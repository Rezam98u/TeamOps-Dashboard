import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../schemas/auth';

const prisma = new PrismaClient();

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const registerUser = async (input: RegisterInput): Promise<AuthResponse> => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      email: true,
      password: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Remove password from response
  const { password: _password, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const refreshUserToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  } catch (_error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
