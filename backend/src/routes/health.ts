import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'],
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRouter };
