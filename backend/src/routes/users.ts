import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  toggleUserStatus,
} from '../services/userService';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userIdSchema,
} from '../schemas/user';

const router = Router();

// Get all users (admin only)
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const filters = {
      role: req.query['role'] as unknown as any,
      isActive: req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined,
      search: req.query['search'] as string,
    };

    const users = await getAllUsers(filters, req.user!.role);
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get user by ID
router.get('/:id', requireAuth, validate(z.object({ params: userIdSchema })), async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params['id'] as string, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create user (admin only)
router.post('/', requireAuth, requireAdmin, validate(z.object({ body: createUserSchema })), async (req: Request, res: Response) => {
  try {
    const user = await createUser(req.body, req.user!.role);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update user
router.put('/:id', requireAuth, validate(z.object({ params: userIdSchema, body: updateUserSchema })), async (req: Request, res: Response) => {
  try {
    const user = await updateUser(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Change password
router.put('/:id/password', requireAuth, validate(z.object({ params: userIdSchema, body: changePasswordSchema })), async (req: Request, res: Response) => {
  try {
    const result = await changePassword(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to change password',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, validate(z.object({ params: userIdSchema })), async (req: Request, res: Response) => {
  try {
    const result = await deleteUser(req.params['id'] as string, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Toggle user status (admin only)
router.patch('/:id/toggle-status', requireAuth, requireAdmin, validate(z.object({ params: userIdSchema })), async (req: Request, res: Response) => {
  try {
    const user = await toggleUserStatus(req.params['id'] as string, req.user!.role);
    
    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as userRouter };
