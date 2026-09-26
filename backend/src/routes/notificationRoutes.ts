import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';

const router = Router();

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        article: { select: { id: true, title: true, canonicalUrl: true, competitorId: true } }
      }
    });

    const unreadCount = await prisma.notification.count({
      where: { read: false }
    });

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
