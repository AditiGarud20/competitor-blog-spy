import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { formatExactDelay } from '../utils/delayCalculator.js';

const router = Router();

// GET /api/analytics - Comprehensive analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { detectedAt: 'asc' },
      include: { competitor: { select: { id: true, name: true } } }
    });

    const competitors = await prisma.competitor.findMany({
      include: { _count: { select: { articles: true, checks: true } } }
    });

    const checks = await prisma.monitoringCheck.findMany({
      orderBy: { startedAt: 'desc' },
      take: 200
    });

    const totalArticles = articles.length;
    const delays = articles.map((a) => a.detectionDelaySeconds).sort((a, b) => a - b);

    // Exact calculations
    const sumDelay = delays.reduce((acc, d) => acc + d, 0);
    const avgDelaySeconds = totalArticles > 0 ? Math.round(sumDelay / totalArticles) : 0;

    let medianDelaySeconds = 0;
    if (totalArticles > 0) {
      const mid = Math.floor(delays.length / 2);
      medianDelaySeconds =
        delays.length % 2 !== 0 ? delays[mid] : Math.round((delays[mid - 1] + delays[mid]) / 2);
    }

    const fastestDelaySeconds = totalArticles > 0 ? delays[0] : 0;
    const slowestDelaySeconds = totalArticles > 0 ? delays[delays.length - 1] : 0;

    const under5mCount = delays.filter((d) => d <= 300).length;
    const above5mCount = delays.filter((d) => d > 300).length;

    // Detection trend (chronological)
    const trend = articles.slice(-40).map((a) => ({
      id: a.id,
      title: a.title.slice(0, 30) + '...',
      competitorName: a.competitor.name,
      detectedAt: a.detectedAt.toISOString(),
      detectionDelaySeconds: a.detectionDelaySeconds,
      delayFormatted: formatExactDelay(a.detectionDelaySeconds),
      method: a.firstDetectedMethod,
      targetThreshold: 300 // 5m reference line
    }));

    // Method breakdown
    const methodCounts: Record<string, number> = { RSS: 0, SITEMAP: 0, DIRECT_PAGE: 0 };
    const methodDelaySums: Record<string, number> = { RSS: 0, SITEMAP: 0, DIRECT_PAGE: 0 };

    articles.forEach((a) => {
      const m = a.firstDetectedMethod || 'RSS';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
      methodDelaySums[m] = (methodDelaySums[m] || 0) + a.detectionDelaySeconds;
    });

    const methodDistribution = Object.keys(methodCounts).map((key) => ({
      method: key,
      count: methodCounts[key],
      avgDelaySeconds:
        methodCounts[key] > 0 ? Math.round(methodDelaySums[key] / methodCounts[key]) : 0,
      avgDelayFormatted: formatExactDelay(
        methodCounts[key] > 0 ? Math.round(methodDelaySums[key] / methodCounts[key]) : 0
      )
    }));

    // Strategy performance comparison
    const strategyStats = ['RSS', 'SITEMAP', 'DIRECT_PAGE'].map((strat) => {
      const stratChecks = checks.filter((c) => c.strategy === strat);
      const stratArticles = articles.filter((a) => a.firstDetectedMethod === strat);
      const fails = stratChecks.filter((c) => c.status === 'ERROR').length;
      const successCount = stratChecks.filter((c) => c.status === 'SUCCESS').length;

      const sumD = stratArticles.reduce((acc, a) => acc + a.detectionDelaySeconds, 0);
      const avgD = stratArticles.length > 0 ? Math.round(sumD / stratArticles.length) : 0;

      let rationale = '';
      if (strat === 'RSS') {
        rationale = 'Delivers fastest publication delta. Recommended primary for blogs with active XML feeds.';
      } else if (strat === 'SITEMAP') {
        rationale = 'Provides comprehensive URL index verification using <lastmod> timestamps.';
      } else {
        rationale = 'Direct DOM parsing fallback when syndication feeds are missing or delayed.';
      }

      return {
        strategy: strat,
        totalChecks: stratChecks.length,
        successfulChecks: successCount,
        failedChecks: fails,
        articlesDetected: stratArticles.length,
        avgDelaySeconds: avgD,
        avgDelayFormatted: formatExactDelay(avgD),
        reliabilityRate:
          stratChecks.length > 0
            ? Math.round((successCount / stratChecks.length) * 100)
            : 100,
        rationale
      };
    });

    // Check aggregates
    const totalChecks = checks.length;
    const successfulChecks = checks.filter((c) => c.status === 'SUCCESS').length;
    const failedChecks = checks.filter((c) => c.status === 'ERROR').length;
    const totalDuplicatesIgnored = checks.reduce((acc, c) => acc + c.duplicatesIgnored, 0);

    res.json({
      summary: {
        totalArticles,
        avgDelaySeconds,
        avgDelayFormatted: formatExactDelay(avgDelaySeconds),
        medianDelaySeconds,
        medianDelayFormatted: formatExactDelay(medianDelaySeconds),
        fastestDelaySeconds,
        fastestDelayFormatted: formatExactDelay(fastestDelaySeconds),
        slowestDelaySeconds,
        slowestDelayFormatted: formatExactDelay(slowestDelaySeconds),
        under5mCount,
        above5mCount,
        under5mPercentage: totalArticles > 0 ? Math.round((under5mCount / totalArticles) * 100) : 100,
        totalCompetitors: competitors.length,
        totalChecks,
        successfulChecks,
        failedChecks,
        totalDuplicatesIgnored
      },
      trend,
      methodDistribution,
      strategyStats,
      competitorsActivity: competitors.map((c) => ({
        id: c.id,
        name: c.name,
        articlesCount: c._count.articles,
        checksCount: c._count.checks,
        status: c.status,
        averageDelaySeconds: c.averageDelaySeconds || 0,
        averageDelayFormatted: formatExactDelay(c.averageDelaySeconds || 0)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
