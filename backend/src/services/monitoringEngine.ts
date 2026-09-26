import { prisma } from '../database/client.js';
import { RSSDetector } from '../detectors/rssDetector.js';
import { SitemapDetector } from '../detectors/sitemapDetector.js';
import { DirectPageDetector } from '../detectors/pageDetector.js';
import { ArticleExtractor } from '../extractors/articleExtractor.js';
import { IContentDetector } from '../detectors/detectorInterface.js';
import {
  DetectionStrategy,
  RawDetectedArticle,
  MonitoringCycleResult
} from '../types/index.js';
import { calculateDelaySeconds, formatExactDelay, isDelayWithinTarget } from '../utils/delayCalculator.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';
import { broadcastEvent } from '../socket/realtime.js';
import { monitoringWorkerPool } from '../queue/workerPool.js';

export class MonitoringEngine {
  private detectors: Map<DetectionStrategy, IContentDetector> = new Map();
  private extractor: ArticleExtractor;
  private isRunning: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private checkIntervalMs: number = 60000; // 1 minute default tick

  constructor() {
    this.detectors.set('RSS', new RSSDetector());
    this.detectors.set('SITEMAP', new SitemapDetector());
    this.detectors.set('DIRECT_PAGE', new DirectPageDetector());
    this.extractor = new ArticleExtractor();
  }

  startContinuousMonitoring(intervalMs: number = 60000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.checkIntervalMs = intervalMs;

    // Run first cycle immediately
    this.runCycleForAll().catch((err) =>
      console.error('Error in initial monitoring cycle:', err)
    );

    this.timer = setInterval(() => {
      this.runCycleForAll().catch((err) =>
        console.error('Error in monitoring cycle interval:', err)
      );
    }, this.checkIntervalMs);

    console.log(`[MonitoringEngine] Continuous background monitoring started (tick: ${intervalMs / 1000}s)`);
  }

  stopContinuousMonitoring(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[MonitoringEngine] Continuous monitoring stopped');
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  async runCycleForAll(): Promise<void> {
    try {
      const activeCompetitors = await prisma.competitor.findMany({
        where: { enabled: true }
      });

      if (activeCompetitors.length === 0) return;

      broadcastEvent('monitoring.cycle_started', {
        timestamp: new Date().toISOString(),
        competitorCount: activeCompetitors.length
      });

      // Enqueue monitoring jobs to the concurrent worker pool
      for (const competitor of activeCompetitors) {
        monitoringWorkerPool
          .addJob(
            `monitor-${competitor.id}-${Date.now()}`,
            `Check: ${competitor.name}`,
            competitor.id,
            (compId) => this.checkCompetitor(compId),
            { maxRetries: 2, retryDelayMs: 2000 }
          )
          .catch((err) => {
            console.error(`Job failed for competitor ${competitor.name}:`, err.message);
          });
      }
    } catch (err) {
      console.error('Failed to trigger monitoring cycle:', err);
    }
  }

  async checkCompetitor(competitorId: string): Promise<MonitoringCycleResult> {
    const startedAt = new Date();
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: { sources: true }
    });

    if (!competitor) {
      throw new Error(`Competitor with id ${competitorId} not found`);
    }

    broadcastEvent('monitoring.started', {
      competitorId: competitor.id,
      competitorName: competitor.name,
      startedAt: startedAt.toISOString()
    });

    // Retrieve known canonical URLs for this competitor to eliminate duplicates immediately
    const existingArticles = await prisma.article.findMany({
      where: { competitorId: competitor.id },
      select: { canonicalUrl: true, contentHash: true }
    });
    const knownUrls = new Set<string>(existingArticles.map((a) => a.canonicalUrl));
    const knownHashes = new Set<string>(existingArticles.map((a) => a.contentHash));

    // Determine strategies in order of preference
    const strategiesToTry: DetectionStrategy[] = [];
    if (competitor.primaryStrategy) strategiesToTry.push(competitor.primaryStrategy as DetectionStrategy);
    if (competitor.secondaryStrategy && !strategiesToTry.includes(competitor.secondaryStrategy as DetectionStrategy)) {
      strategiesToTry.push(competitor.secondaryStrategy as DetectionStrategy);
    }
    if (competitor.fallbackStrategy && !strategiesToTry.includes(competitor.fallbackStrategy as DetectionStrategy)) {
      strategiesToTry.push(competitor.fallbackStrategy as DetectionStrategy);
    }
    if (strategiesToTry.length === 0) strategiesToTry.push('RSS');

    let cycleSuccess = false;
    let lastError: string | null = null;
    let httpStatus: number = 200;
    let urlsCheckedCount = 0;
    let totalFoundCount = 0;
    let newArticlesCount = 0;
    let duplicatesIgnoredCount = 0;
    const detectedResults: MonitoringCycleResult['detectedArticles'] = [];
    let chosenStrategy: DetectionStrategy = strategiesToTry[0];

    for (const strategy of strategiesToTry) {
      chosenStrategy = strategy;
      const detector = this.detectors.get(strategy);
      if (!detector) continue;

      // Determine target URL for strategy
      let targetSourceUrl: string | null = null;
      if (strategy === 'RSS') targetSourceUrl = competitor.rssUrl || competitor.websiteUrl;
      else if (strategy === 'SITEMAP') targetSourceUrl = competitor.sitemapUrl || competitor.websiteUrl;
      else targetSourceUrl = competitor.blogUrl || competitor.websiteUrl;

      if (!targetSourceUrl) continue;

      try {
        urlsCheckedCount++;
        const rawArticles = await detector.detectNewArticles(targetSourceUrl, knownUrls);
        totalFoundCount += rawArticles.length;

        for (const raw of rawArticles) {
          const canonical = normalizeUrl(raw.canonicalUrl || raw.url);

          // Duplicate verification (URL & hash)
          if (knownUrls.has(canonical)) {
            duplicatesIgnoredCount++;

            // Multi-strategy record update: record that this strategy also saw it
            const existing = await prisma.article.findUnique({
              where: { canonicalUrl: canonical }
            });

            if (existing) {
              let methods: string[] = [];
              try {
                methods = JSON.parse(existing.detectedMethods);
              } catch {
                methods = [existing.firstDetectedMethod];
              }

              if (!methods.includes(strategy)) {
                methods.push(strategy);
                await prisma.article.update({
                  where: { id: existing.id },
                  data: { detectedMethods: JSON.stringify(methods) }
                });

                await prisma.detectionEvent.create({
                  data: {
                    articleId: existing.id,
                    competitorId: competitor.id,
                    method: strategy,
                    checkedAt: startedAt,
                    detectedAt: new Date(),
                    publishedAt: existing.publishedAt,
                    delaySeconds: calculateDelaySeconds(existing.publishedAt, new Date())
                  }
                });
              }
            }
            continue;
          }

          // Extract complete article metadata & content
          const extracted = await this.extractor.extractFromUrl(
            raw.url,
            raw.title,
            raw.publishedAt
          );

          if (knownHashes.has(extracted.contentHash)) {
            duplicatesIgnoredCount++;
            continue;
          }

          const detectedAt = new Date();
          const delaySeconds = calculateDelaySeconds(extracted.publishedAt, detectedAt);
          const delayFormatted = formatExactDelay(delaySeconds);
          const isWithin = isDelayWithinTarget(delaySeconds);

          // Save new Article record
          const createdArticle = await prisma.article.create({
            data: {
              competitorId: competitor.id,
              title: extracted.title,
              canonicalUrl: extracted.canonicalUrl,
              originalUrl: extracted.originalUrl,
              content: extracted.content,
              excerpt: extracted.excerpt,
              featuredImage: extracted.featuredImage,
              inlineImages: JSON.stringify(extracted.inlineImages),
              author: extracted.author || raw.author,
              publishedAt: extracted.publishedAt,
              detectedAt,
              detectionDelaySeconds: delaySeconds,
              metaDescription: extracted.metaDescription,
              categories: JSON.stringify(extracted.categories),
              tags: JSON.stringify(extracted.tags),
              relevantLinks: JSON.stringify(extracted.relevantLinks),
              structuredData: extracted.structuredData ? JSON.stringify(extracted.structuredData) : null,
              contentHash: extracted.contentHash,
              guid: raw.guid,
              status: 'DETECTED',
              firstDetectedMethod: strategy,
              detectedMethods: JSON.stringify([strategy])
            }
          });

          // Save DetectionEvent
          await prisma.detectionEvent.create({
            data: {
              articleId: createdArticle.id,
              competitorId: competitor.id,
              method: strategy,
              checkedAt: startedAt,
              detectedAt,
              publishedAt: extracted.publishedAt,
              delaySeconds
            }
          });

          // Create Notification
          const notificationType = isWithin ? 'TARGET_MET' : 'TARGET_EXCEEDED';
          const notification = await prisma.notification.create({
            data: {
              type: notificationType,
              title: `New Article: ${competitor.name}`,
              message: `"${extracted.title}" detected via ${strategy}. Delay: ${delayFormatted} (${isWithin ? 'Within 5m target' : 'Exceeded target'}).`,
              competitorId: competitor.id,
              articleId: createdArticle.id,
              delaySeconds,
              method: strategy
            }
          });

          knownUrls.add(canonical);
          knownHashes.add(extracted.contentHash);
          newArticlesCount++;

          detectedResults.push({
            id: createdArticle.id,
            title: createdArticle.title,
            detectionDelaySeconds: delaySeconds,
            delayFormatted,
            isWithinTarget: isWithin
          });

          // Realtime broadcast for instant frontend event stream
          broadcastEvent('article.detected', {
            article: {
              id: createdArticle.id,
              competitorId: competitor.id,
              competitorName: competitor.name,
              title: createdArticle.title,
              canonicalUrl: createdArticle.canonicalUrl,
              publishedAt: createdArticle.publishedAt.toISOString(),
              detectedAt: createdArticle.detectedAt.toISOString(),
              detectionDelaySeconds: delaySeconds,
              delayFormatted,
              isWithinTarget: isWithin,
              method: strategy,
              featuredImage: createdArticle.featuredImage
            },
            notification
          });
        }

        cycleSuccess = true;
        break; // Successfully completed primary/fallback strategy
      } catch (err: any) {
        lastError = err.message || String(err);
        httpStatus = err.response?.status || 500;
        console.warn(
          `[MonitoringEngine] Strategy ${strategy} failed for ${competitor.name}:`,
          lastError
        );
      }
    }

    const completedAt = new Date();
    const durationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());

    // Update competitor statistics in DB
    const totalArticles = await prisma.article.count({
      where: { competitorId: competitor.id }
    });

    const articlesWithDelay = await prisma.article.findMany({
      where: { competitorId: competitor.id },
      select: { detectionDelaySeconds: true }
    });

    const avgDelay =
      articlesWithDelay.length > 0
        ? Math.round(
            articlesWithDelay.reduce((acc, a) => acc + a.detectionDelaySeconds, 0) /
              articlesWithDelay.length
          )
        : null;

    if (cycleSuccess) {
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          status: 'ACTIVE',
          lastCheckedAt: completedAt,
          lastSuccessAt: completedAt,
          lastError: null,
          failureCount: 0,
          articlesCount: totalArticles,
          averageDelaySeconds: avgDelay
        }
      });
    } else {
      const nextFailureCount = competitor.failureCount + 1;
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          status: nextFailureCount >= 3 ? 'ERROR' : 'TEMPORARILY_UNAVAILABLE',
          lastCheckedAt: completedAt,
          lastError,
          failureCount: nextFailureCount
        }
      });

      // Record error
      await prisma.monitoringError.create({
        data: {
          competitorId: competitor.id,
          strategy: chosenStrategy,
          errorMessage: lastError || 'Unknown connection error',
          statusCode: httpStatus
        }
      });
    }

    // Log monitoring check
    const checkRecord = await prisma.monitoringCheck.create({
      data: {
        competitorId: competitor.id,
        strategy: chosenStrategy,
        startedAt,
        completedAt,
        durationMs,
        status: cycleSuccess ? 'SUCCESS' : 'ERROR',
        urlsChecked: urlsCheckedCount,
        articlesFound: totalFoundCount,
        newArticles: newArticlesCount,
        duplicatesIgnored: duplicatesIgnoredCount,
        httpStatus,
        errorMessage: cycleSuccess ? null : lastError,
        retryCount: cycleSuccess ? 0 : 1
      }
    });

    const result: MonitoringCycleResult = {
      competitorId: competitor.id,
      strategy: chosenStrategy,
      startedAt,
      completedAt,
      durationMs,
      status: cycleSuccess ? 'SUCCESS' : 'ERROR',
      urlsChecked: urlsCheckedCount,
      articlesFound: totalFoundCount,
      newArticles: newArticlesCount,
      duplicatesIgnored: duplicatesIgnoredCount,
      httpStatus,
      errorMessage: cycleSuccess ? undefined : (lastError ?? undefined),
      retryCount: cycleSuccess ? 0 : 1,
      detectedArticles: detectedResults
    };

    broadcastEvent('monitoring.completed', {
      competitorId: competitor.id,
      competitorName: competitor.name,
      check: checkRecord,
      result
    });

    return result;
  }
}

export const monitoringEngine = new MonitoringEngine();
