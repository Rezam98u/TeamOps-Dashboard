import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assignEmployeeToProject,
  removeEmployeeFromProject,
} from '../services/projectService';
import { requireAuth, requireManager } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  assignEmployeeSchema,
} from '../schemas/project';

const router = Router();

// Get all projects
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query['status'] as unknown as any,
      managerId: req.query['managerId'] as string,
      search: req.query['search'] as string,
    };

    const projects = await getAllProjects(filters, req.user!.role, req.user!.id);
    
    res.json({
      success: true,
      message: 'Projects retrieved successfully',
      data: { projects },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get project by ID
router.get('/:id', requireAuth, validate(z.object({ params: projectIdSchema })), async (req: Request, res: Response) => {
  try {
    const project = await getProjectById(req.params['id'] as string, req.user!.role, req.user!.id);
    
    res.json({
      success: true,
      message: 'Project retrieved successfully',
      data: { project },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create project (admin and managers only)
router.post('/', requireAuth, requireManager, validate(z.object({ body: createProjectSchema })), async (req: Request, res: Response) => {
  try {
    const project = await createProject(req.body, req.user!.id, req.user!.role);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update project
router.put('/:id', requireAuth, validate(z.object({ params: projectIdSchema, body: updateProjectSchema })), async (req: Request, res: Response) => {
  try {
    const project = await updateProject(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete project (admin only)
router.delete('/:id', requireAuth, requireManager, validate(z.object({ params: projectIdSchema })), async (req: Request, res: Response) => {
  try {
    const result = await deleteProject(req.params['id'] as string, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Assign employee to project
router.post('/:id/assign', requireAuth, validate(z.object({ params: projectIdSchema, body: assignEmployeeSchema })), async (req: Request, res: Response) => {
  try {
    const assignment = await assignEmployeeToProject(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: { assignment },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to assign employee to project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Remove employee from project
router.delete('/:id/assign/:userId', requireAuth, validate(z.object({ params: z.object({ id: projectIdSchema.shape.id, userId: z.string().cuid() }) })), async (req: Request, res: Response) => {
  try {
    const result = await removeEmployeeFromProject(req.params['id'] as string, req.params['userId'] as string, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to remove employee from project',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as projectRouter };
