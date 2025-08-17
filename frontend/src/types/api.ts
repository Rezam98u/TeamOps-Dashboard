import { z } from 'zod'

export const userRoleSchema = z.union([z.literal('ADMIN'), z.literal('MANAGER'), z.literal('EMPLOYEE')])

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})
export type User = z.infer<typeof userSchema>

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.union([
    z.literal('PLANNING'),
    z.literal('IN_PROGRESS'),
    z.literal('COMPLETED'),
    z.literal('ON_HOLD'),
    z.literal('CANCELLED'),
  ]),
  manager: userSchema.optional().nullable(),
  creator: userSchema.optional().nullable(),
})
export type Project = z.infer<typeof projectSchema>

export const kpiSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: z.union([z.literal('NUMERIC'), z.literal('PERCENTAGE'), z.literal('CURRENCY'), z.literal('BOOLEAN')]),
  isActive: z.boolean().optional(),
})
export type Kpi = z.infer<typeof kpiSchema>

export const kpiValueSchema = z.object({
  id: z.string(),
  value: z.number(),
  date: z.string(),
  notes: z.string().nullable().optional(),
  user: userSchema.optional().nullable(),
})
export type KpiValue = z.infer<typeof kpiValueSchema>


