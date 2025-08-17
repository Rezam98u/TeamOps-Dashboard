import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  getAllKpis,
  getKpiById,
  createKpi,
  updateKpi,
  deleteKpi,
  getKpiValues,
  createKpiValue,
  updateKpiValue,
  deleteKpiValue,
} from '../services/kpiService';
import { requireAuth, requireManager } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createKpiSchema,
  updateKpiSchema,
  kpiIdSchema,
  createKpiValueSchema,
  updateKpiValueSchema,
  kpiValueIdSchema,
} from '../schemas/kpi';

const router = Router();

// Get all KPIs
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filters = {
      type: req.query['type'] as unknown as any,
      isActive: req.query['isActive'] === 'true' ? true : req.query['isActive'] === 'false' ? false : undefined,
      projectId: req.query['projectId'] as string,
      search: req.query['search'] as string,
    };

    const kpis = await getAllKpis(filters, req.user!.role, req.user!.id);
    
    res.json({
      success: true,
      message: 'KPIs retrieved successfully',
      data: { kpis },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve KPIs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get KPI by ID
router.get('/:id', requireAuth, validate(z.object({ params: kpiIdSchema })), async (req: Request, res: Response) => {
  try {
    const kpi = await getKpiById(req.params['id'] as string, req.user!.role, req.user!.id);
    
    res.json({
      success: true,
      message: 'KPI retrieved successfully',
      data: { kpi },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve KPI',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create KPI (admin and managers only)
router.post('/', requireAuth, requireManager, validate(z.object({ body: createKpiSchema })), async (req: Request, res: Response) => {
  try {
    const kpi = await createKpi(req.body, req.user!.id, req.user!.role);
    
    res.status(201).json({
      success: true,
      message: 'KPI created successfully',
      data: { kpi },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create KPI',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update KPI
router.put('/:id', requireAuth, validate(z.object({ params: kpiIdSchema, body: updateKpiSchema })), async (req: Request, res: Response) => {
  try {
    const kpi = await updateKpi(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: 'KPI updated successfully',
      data: { kpi },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update KPI',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete KPI
router.delete('/:id', requireAuth, validate(z.object({ params: kpiIdSchema })), async (req: Request, res: Response) => {
  try {
    const result = await deleteKpi(req.params['id'] as string, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete KPI',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get KPI values
router.get('/:id/values', requireAuth, validate(z.object({ params: kpiIdSchema })), async (req: Request, res: Response) => {
  try {
    const values = await getKpiValues(req.params['id'] as string, req.user!.role, req.user!.id);
    
    res.json({
      success: true,
      message: 'KPI values retrieved successfully',
      data: { values },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to retrieve KPI values',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create KPI value
router.post('/:id/values', requireAuth, validate(z.object({ params: kpiIdSchema, body: createKpiValueSchema })), async (req: Request, res: Response) => {
  try {
    const kpiValue = await createKpiValue(req.params['id'] as string, req.body, req.user!.id, req.user!.role);
    
    res.status(201).json({
      success: true,
      message: 'KPI value created successfully',
      data: { kpiValue },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create KPI value',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update KPI value
router.put('/:id/values/:valueId', requireAuth, validate(z.object({ params: z.object({ id: kpiIdSchema.shape.id, valueId: kpiValueIdSchema.shape.id }), body: updateKpiValueSchema })), async (req: Request, res: Response) => {
  try {
    const kpiValue = await updateKpiValue(req.params['id'] as string, req.params['valueId'] as string, req.body, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: 'KPI value updated successfully',
      data: { kpiValue },
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to update KPI value',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete KPI value
router.delete('/:id/values/:valueId', requireAuth, validate(z.object({ params: z.object({ id: kpiIdSchema.shape.id, valueId: kpiValueIdSchema.shape.id }) })), async (req: Request, res: Response) => {
  try {
    const result = await deleteKpiValue(req.params['id'] as string, req.params['valueId'] as string, req.user!.id, req.user!.role);
    
    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Failed to delete KPI value',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as kpiRouter };
