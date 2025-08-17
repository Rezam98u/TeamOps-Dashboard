import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';
import { CreateUserInput, UpdateUserInput, ChangePasswordInput } from '../schemas/user';

const prisma = new PrismaClient();

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean | undefined;
  search?: string;
}

export const getAllUsers = async (filters: UserFilters = {}, currentUserRole: UserRole) => {
  // Only admins can see all users
  if (currentUserRole !== 'ADMIN') {
    throw new AppError('Insufficient permissions', 403);
  }

  const where: Record<string, unknown> = {};

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
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
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

export const getUserById = async (userId: string, currentUserId: string, currentUserRole: UserRole) => {
  // Users can only see their own profile, admins can see any user
  if (currentUserRole !== 'ADMIN' && currentUserId !== userId) {
    throw new AppError('Insufficient permissions', 403);
  }

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

export const createUser = async (input: CreateUserInput, currentUserRole: UserRole) => {
  // Only admins can create users
  if (currentUserRole !== 'ADMIN') {
    throw new AppError('Insufficient permissions', 403);
  }

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
      isActive: input.isActive,
    },
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

  return user;
};

export const updateUser = async (
  userId: string,
  input: UpdateUserInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Users can only update their own profile, admins can update any user
  if (currentUserRole !== 'ADMIN' && currentUserId !== userId) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it already exists
  if (input.email && input.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (emailExists) {
      throw new AppError('User with this email already exists', 409);
    }
  }

  // Non-admins cannot change role or isActive status
  if (currentUserRole !== 'ADMIN') {
    delete input.role;
    delete input.isActive;
  }

  // Filter out undefined values
  const updateData: Record<string, unknown> = {};
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
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

  return user;
};

export const changePassword = async (
  userId: string,
  input: ChangePasswordInput,
  currentUserId: string,
  currentUserRole: UserRole
) => {
  // Users can only change their own password, admins can change any password
  if (currentUserRole !== 'ADMIN' && currentUserId !== userId) {
    throw new AppError('Insufficient permissions', 403);
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password (only for non-admin users)
  if (currentUserRole !== 'ADMIN') {
    const isCurrentPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(input.newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { message: 'Password updated successfully' };
};

export const deleteUser = async (userId: string, currentUserRole: UserRole) => {
  // Only admins can delete users
  if (currentUserRole !== 'ADMIN') {
    throw new AppError('Insufficient permissions', 403);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete user (this will cascade to related records)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'User deleted successfully' };
};

export const toggleUserStatus = async (userId: string, currentUserRole: UserRole) => {
  // Only admins can toggle user status
  if (currentUserRole !== 'ADMIN') {
    throw new AppError('Insufficient permissions', 403);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Toggle status
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
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

  return updatedUser;
};
