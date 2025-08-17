import { z } from 'zod';

export const createKpiSchema = z.object({
  name: z.string().min(1, 'KPI name is required').max(100, 'KPI name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['NUMERIC', 'PERCENTAGE', 'CURRENCY', 'BOOLEAN']).default('NUMERIC'),
  target: z.number().optional(),
  unit: z.string().max(20, 'Unit too long').optional(),
  isActive: z.boolean().default(true),
  projectId: z.string().cuid('Invalid project ID').optional(),
});

export const updateKpiSchema = z.object({
  name: z.string().min(1, 'KPI name is required').max(100, 'KPI name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  type: z.enum(['NUMERIC', 'PERCENTAGE', 'CURRENCY', 'BOOLEAN']).optional(),
  target: z.number().optional(),
  unit: z.string().max(20, 'Unit too long').optional(),
  isActive: z.boolean().optional(),
  projectId: z.string().cuid('Invalid project ID').optional(),
});

export const kpiIdSchema = z.object({
  id: z.string().cuid('Invalid KPI ID'),
});

export const createKpiValueSchema = z.object({
  value: z.number(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const updateKpiValueSchema = z.object({
  value: z.number().optional(),
  date: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const kpiValueIdSchema = z.object({
  id: z.string().cuid('Invalid KPI value ID'),
});

export type CreateKpiInput = z.infer<typeof createKpiSchema>;
export type UpdateKpiInput = z.infer<typeof updateKpiSchema>;
export type KpiIdInput = z.infer<typeof kpiIdSchema>;
export type CreateKpiValueInput = z.infer<typeof createKpiValueSchema>;
export type UpdateKpiValueInput = z.infer<typeof updateKpiValueSchema>;
export type KpiValueIdInput = z.infer<typeof kpiValueIdSchema>;
