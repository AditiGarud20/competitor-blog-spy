import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { monitoringWorkerPool } from '../queue/workerPool.js';
import { monitoringEngine } from '../services/monitoringEngine.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  let dbStatus = 'CONNECTED';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = 'DISCONNECTED';
  }

  const lastCheck = await prisma.monitoringCheck.findFirst({
    orderBy: { completedAt: 'desc' }
  });

  res.json({
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      engine: 'SQLite (zero-friction embedded) / PostgreSQL ready'
    },
    workerPool: {
      status: 'ACTIVE',
      concurrency: monitoringWorkerPool.getConcurrency(),
      activeWorkers: monitoringWorkerPool.getStats().active,
      queuedJobs: monitoringWorkerPool.getStats().queued,
      totalProcessed: monitoringWorkerPool.getStats().totalProcessed
    },
    scheduler: {
      status: monitoringEngine.getIsRunning() ? 'RUNNING' : 'STANDBY',
      lastMonitoringCycle: lastCheck ? lastCheck.completedAt.toISOString() : null
    },
    system: {
      memoryUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      memoryTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

export default router;
