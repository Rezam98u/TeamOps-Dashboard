import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  managerId: z.string().cuid('Invalid manager ID'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive('Budget must be positive').optional(),
  managerId: z.string().cuid('Invalid manager ID').optional(),
});

export const projectIdSchema = z.object({
  id: z.string().cuid('Invalid project ID'),
});

export const assignEmployeeSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.string().max(50, 'Role too long').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const removeEmployeeSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type AssignEmployeeInput = z.infer<typeof assignEmployeeSchema>;
export type RemoveEmployeeInput = z.infer<typeof removeEmployeeSchema>;
