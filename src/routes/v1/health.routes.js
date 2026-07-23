import { Router } from 'express';
import { prisma } from '../../db/client.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', db: 'connected' } });
  } catch {
    res.status(503).json({
      success: false,
      data: { status: 'degraded', db: 'error' },
    });
  }
});

export { router as healthRoutes };
