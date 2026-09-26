import { Router, Request, Response } from 'express';
import { scaleTestEngine } from '../services/scaleTestEngine.js';

const router = Router();

// GET /api/scale-test/status
router.get('/status', (req: Request, res: Response) => {
  res.json(scaleTestEngine.getStatus());
});

// POST /api/scale-test/run - Start 100-site simulation
router.post('/run', async (req: Request, res: Response) => {
  const { siteCount = 100, concurrency = 10 } = req.body;
  // Launch asynchronously in background and return immediate progress state
  scaleTestEngine.run100SiteSimulation({
    siteCount: Number(siteCount) || 100,
    concurrency: Number(concurrency) || 10
  });

  res.json({
    success: true,
    message: `100-site scale test initiated with concurrency ${concurrency}`,
    progress: scaleTestEngine.getStatus()
  });
});

// POST /api/scale-test/cancel
router.post('/cancel', (req: Request, res: Response) => {
  scaleTestEngine.cancel();
  res.json({ success: true, message: 'Scale test cancelled' });
});

export default router;
