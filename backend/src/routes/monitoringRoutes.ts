import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { monitoringEngine } from '../services/monitoringEngine.js';
import { monitoringWorkerPool } from '../queue/workerPool.js';

const router = Router();

// GET /api/monitoring/logs - List monitoring check logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { competitorId, status, strategy, page = '1', limit = '30' } = req.query;

    const where: any = {};
    if (competitorId && typeof competitorId === 'string') {
      where.competitorId = competitorId;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (strategy && typeof strategy === 'string') {
      where.strategy = strategy;
    }

    const take = parseInt(limit as string, 10) || 30;
    const skip = (Math.max(1, parseInt(page as string, 10)) - 1) * take;

    const [checks, total] = await Promise.all([
      prisma.monitoringCheck.findMany({
        where,
        include: {
          competitor: { select: { id: true, name: true, websiteUrl: true } }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take
      }),
      prisma.monitoringCheck.count({ where })
    ]);

    res.json({
      logs: checks,
      pagination: {
        total,
        page: parseInt(page as string, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/monitoring/status - Get engine and queue status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    isRunning: monitoringEngine.getIsRunning(),
    workerPool: monitoringWorkerPool.getStats()
  });
});

// POST /api/monitoring/start - Start continuous monitoring
router.post('/start', (req: Request, res: Response) => {
  const { intervalSeconds = 60 } = req.body;
  monitoringEngine.startContinuousMonitoring(Number(intervalSeconds) * 1000);
  res.json({ success: true, message: 'Continuous monitoring started' });
});

// POST /api/monitoring/stop - Stop continuous monitoring
router.post('/stop', (req: Request, res: Response) => {
  monitoringEngine.stopContinuousMonitoring();
  res.json({ success: true, message: 'Continuous monitoring stopped' });
});

// POST /api/monitoring/trigger-all - Trigger immediate check across all competitors
router.post('/trigger-all', async (req: Request, res: Response) => {
  try {
    await monitoringEngine.runCycleForAll();
    res.json({ success: true, message: 'Monitoring cycle dispatched for all active competitors' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
