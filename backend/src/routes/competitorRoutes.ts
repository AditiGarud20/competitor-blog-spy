import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { WebsiteAnalyzer } from '../services/websiteAnalyzer.js';
import { monitoringEngine } from '../services/monitoringEngine.js';

const router = Router();
const analyzer = new WebsiteAnalyzer();

// GET /api/competitors - List all competitors
router.get('/', async (req: Request, res: Response) => {
  try {
    const competitors = await prisma.competitor.findMany({
      include: {
        sources: true,
        _count: { select: { articles: true, checks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(competitors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors/analyze-url - Preliminary 10-step analysis and persistent database storage
router.post('/analyze-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const analysis = await analyzer.analyze(url);

    // Persist searched website directly into backend database
    let domain = 'unknown';
    try {
      domain = new URL(analysis.websiteUrl).hostname.replace('www.', '');
    } catch {}

    const searchRecord = await prisma.websiteSearchRecord.create({
      data: {
        query: url,
        domain,
        websiteUrl: analysis.websiteUrl,
        title: `${domain.split('.')[0].toUpperCase()} Media`,
        status: 'ANALYZED',
        rssFound: analysis.rssFound,
        rssUrl: analysis.rssUrl,
        sitemapFound: analysis.sitemapFound,
        sitemapUrl: analysis.sitemapUrl,
        blogUrl: analysis.blogUrl,
        primaryStrategy: analysis.recommendedPrimaryStrategy || 'RSS',
        findings: JSON.stringify(analysis)
      }
    });

    res.json({
      ...analysis,
      databaseStored: true,
      searchRecordId: searchRecord.id,
      storedAt: searchRecord.searchedAt.toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors - Create new competitor
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name,
      websiteUrl,
      blogUrl,
      rssUrl,
      sitemapUrl,
      primaryStrategy,
      secondaryStrategy,
      fallbackStrategy,
      checkIntervalMinutes = 5,
      enabled = true,
      analysisData
    } = req.body;

    if (!name || !websiteUrl) {
      return res.status(400).json({ error: 'Name and websiteUrl are required' });
    }

    const competitor = await prisma.competitor.create({
      data: {
        name,
        websiteUrl,
        blogUrl,
        rssUrl,
        sitemapUrl,
        primaryStrategy: primaryStrategy || 'RSS',
        secondaryStrategy,
        fallbackStrategy,
        checkIntervalMinutes: Number(checkIntervalMinutes) || 5,
        enabled: Boolean(enabled),
        status: 'ACTIVE',
        analysisData: analysisData ? JSON.stringify(analysisData) : null
      }
    });

    // Create monitoring sources
    if (rssUrl) {
      await prisma.monitoringSource.create({
        data: { competitorId: competitor.id, type: 'RSS', url: rssUrl, status: 'ACTIVE' }
      });
    }
    if (sitemapUrl) {
      await prisma.monitoringSource.create({
        data: { competitorId: competitor.id, type: 'SITEMAP', url: sitemapUrl, status: 'ACTIVE' }
      });
    }
    if (blogUrl) {
      await prisma.monitoringSource.create({
        data: { competitorId: competitor.id, type: 'DIRECT_PAGE', url: blogUrl, status: 'ACTIVE' }
      });
    }

    res.status(201).json(competitor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/competitors/:id - Detail view
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const competitor = await prisma.competitor.findUnique({
      where: { id: req.params.id },
      include: {
        sources: true,
        checks: {
          orderBy: { startedAt: 'desc' },
          take: 20
        },
        articles: {
          orderBy: { detectedAt: 'desc' },
          take: 15
        }
      }
    });

    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json(competitor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/competitors/:id - Update
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      name,
      websiteUrl,
      blogUrl,
      rssUrl,
      sitemapUrl,
      primaryStrategy,
      secondaryStrategy,
      fallbackStrategy,
      checkIntervalMinutes,
      enabled
    } = req.body;

    const updated = await prisma.competitor.update({
      where: { id: req.params.id },
      data: {
        name,
        websiteUrl,
        blogUrl,
        rssUrl,
        sitemapUrl,
        primaryStrategy,
        secondaryStrategy,
        fallbackStrategy,
        checkIntervalMinutes: checkIntervalMinutes !== undefined ? Number(checkIntervalMinutes) : undefined,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/competitors/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.competitor.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Competitor deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors/:id/check - Trigger immediate manual check
router.post('/:id/check', async (req: Request, res: Response) => {
  try {
    const result = await monitoringEngine.checkCompetitor(req.params.id);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/competitors/:id/toggle - Toggle pause/resume
router.post('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const competitor = await prisma.competitor.findUnique({
      where: { id: req.params.id }
    });
    if (!competitor) return res.status(404).json({ error: 'Not found' });

    const nextState = !competitor.enabled;
    const updated = await prisma.competitor.update({
      where: { id: competitor.id },
      data: {
        enabled: nextState,
        status: nextState ? 'ACTIVE' : 'PAUSED'
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
