import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { WebsiteAnalyzer } from '../services/websiteAnalyzer.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';
import { broadcastEvent } from '../socket/realtime.js';

const router = Router();
const analyzer = new WebsiteAnalyzer();

// GET /api/searches - Retrieve all searched websites stored in the backend database
router.get('/', async (req: Request, res: Response) => {
  try {
    const searches = await prisma.websiteSearchRecord.findMany({
      orderBy: { searchedAt: 'desc' },
      take: 50
    });
    res.json(searches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/searches - Search for a website, analyze it, and save directly to backend database
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, query } = req.body;
    const target = (url || query || '').trim();

    if (!target) {
      return res.status(400).json({ error: 'Website URL or search query is required' });
    }

    // Format target into valid URL if bare domain provided
    let normalized = target;
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    normalized = normalizeUrl(normalized);

    const domain = new URL(normalized).hostname.replace('www.', '');
    const cleanTitle = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    // 1. Run server-side 10-step website analysis
    const analysis = await analyzer.analyze(normalized);

    // 2. Save directly into backend database (WebsiteSearchRecord table)
    const searchRecord = await prisma.websiteSearchRecord.create({
      data: {
        query: target,
        domain,
        websiteUrl: normalized,
        title: `${cleanTitle} Media`,
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

    // 3. Ensure it is also saved as a tracked Competitor in the database if not already present
    let competitor = await prisma.competitor.findFirst({
      where: {
        OR: [
          { websiteUrl: normalized },
          { name: { contains: cleanTitle } }
        ]
      }
    });

    if (!competitor) {
      competitor = await prisma.competitor.create({
        data: {
          name: `${cleanTitle} Intelligence`,
          websiteUrl: normalized,
          blogUrl: analysis.blogUrl,
          rssUrl: analysis.rssUrl,
          sitemapUrl: analysis.sitemapUrl,
          primaryStrategy: analysis.recommendedPrimaryStrategy || 'RSS',
          secondaryStrategy: analysis.recommendedSecondaryStrategy,
          fallbackStrategy: analysis.recommendedFallbackStrategy,
          status: 'ACTIVE',
          enabled: true,
          checkIntervalMinutes: 5,
          analysisData: JSON.stringify(analysis)
        }
      });

      // Save discovered sources to backend database
      if (analysis.rssUrl) {
        await prisma.monitoringSource.create({
          data: { competitorId: competitor.id, type: 'RSS', url: analysis.rssUrl, status: 'ACTIVE' }
        });
      }
      if (analysis.sitemapUrl) {
        await prisma.monitoringSource.create({
          data: { competitorId: competitor.id, type: 'SITEMAP', url: analysis.sitemapUrl, status: 'ACTIVE' }
        });
      }
      if (analysis.blogUrl) {
        await prisma.monitoringSource.create({
          data: { competitorId: competitor.id, type: 'DIRECT_PAGE', url: analysis.blogUrl, status: 'ACTIVE' }
        });
      }

      // Link search record to competitor
      await prisma.websiteSearchRecord.update({
        where: { id: searchRecord.id },
        data: { competitorId: competitor.id }
      });
    }

    broadcastEvent('website.searched', {
      searchRecord,
      competitor,
      message: `Website "${domain}" searched and stored in backend database.`
    });

    res.status(201).json({
      success: true,
      message: `Website data for ${domain} successfully stored in backend database`,
      searchRecord,
      competitor,
      analysis
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/searches/:id - Delete a search record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.websiteSearchRecord.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Search record removed from backend database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
