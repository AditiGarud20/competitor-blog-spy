import { WorkerPool } from '../queue/workerPool.js';
import { ScaleTestConfig, ScaleTestProgress } from '../types/index.js';
import { broadcastEvent } from '../socket/realtime.js';

export class ScaleTestEngine {
  private currentProgress: ScaleTestProgress = {
    testId: '',
    totalSites: 100,
    concurrency: 10,
    status: 'IDLE',
    completed: 0,
    processing: 0,
    queued: 0,
    failed: 0,
    retries: 0,
    duplicatesPrevented: 0,
    avgDurationMs: 0,
    peakConcurrency: 0,
    startTime: null,
    endTime: null,
    elapsedSeconds: 0,
    recentJobs: []
  };

  private activePool: WorkerPool | null = null;
  private isCancelled = false;

  getStatus(): ScaleTestProgress {
    return this.currentProgress;
  }

  cancel(): void {
    this.isCancelled = true;
    if (this.activePool) {
      this.activePool.clearQueue();
    }
    this.currentProgress.status = 'CANCELLED';
    this.currentProgress.endTime = Date.now();
    broadcastEvent('scale-test.progress', this.currentProgress);
  }

  async run100SiteSimulation(config: Partial<ScaleTestConfig> = {}): Promise<ScaleTestProgress> {
    const totalSites = config.siteCount || 100;
    const concurrency = config.concurrency || 10;
    const testId = `scale-${Date.now()}`;

    this.isCancelled = false;
    const pool = new WorkerPool(concurrency);
    this.activePool = pool;

    const startTime = Date.now();
    this.currentProgress = {
      testId,
      totalSites,
      concurrency,
      status: 'RUNNING',
      completed: 0,
      processing: 0,
      queued: totalSites,
      failed: 0,
      retries: 0,
      duplicatesPrevented: 0,
      avgDurationMs: 0,
      peakConcurrency: 0,
      startTime,
      endTime: null,
      elapsedSeconds: 0,
      recentJobs: []
    };

    broadcastEvent('scale-test.progress', this.currentProgress);

    // Generate 100 mock site profiles with realistic profiles
    // 70% fast normal sites (80-350ms)
    // 15% slow or complex sites (800-2200ms)
    // 8% duplicate detection heavy sites
    // 7% temporary error / retry sites
    const siteProfiles = Array.from({ length: totalSites }, (_, i) => {
      const idx = i + 1;
      const typeRoll = Math.random();

      let behavior: 'FAST' | 'NORMAL' | 'SLOW' | 'DUPLICATE_HEAVY' | 'TRANSIENT_ERROR' = 'NORMAL';
      let latencyMs = 150 + Math.floor(Math.random() * 200);

      if (typeRoll < 0.60) {
        behavior = 'FAST';
        latencyMs = 60 + Math.floor(Math.random() * 150);
      } else if (typeRoll < 0.80) {
        behavior = 'SLOW';
        latencyMs = 800 + Math.floor(Math.random() * 1400);
      } else if (typeRoll < 0.92) {
        behavior = 'DUPLICATE_HEAVY';
        latencyMs = 120 + Math.floor(Math.random() * 300);
      } else {
        behavior = 'TRANSIENT_ERROR';
        latencyMs = 400 + Math.floor(Math.random() * 600);
      }

      const strategies = ['RSS', 'SITEMAP', 'DIRECT_PAGE'];
      const strategy = strategies[idx % strategies.length];

      return {
        id: `site-${idx}`,
        name: `Competitor Node #${idx < 10 ? '0' + idx : idx} (${strategy})`,
        strategy,
        behavior,
        baseLatencyMs: latencyMs
      };
    });

    const totalDurations: number[] = [];

    // Worker pool events
    pool.on('job:started', () => {
      this.currentProgress.processing++;
      this.currentProgress.queued = Math.max(0, this.currentProgress.queued - 1);
      this.currentProgress.peakConcurrency = Math.max(
        this.currentProgress.peakConcurrency,
        this.currentProgress.processing
      );
      this.emitProgress();
    });

    pool.on('job:retry', () => {
      this.currentProgress.retries++;
      this.emitProgress();
    });

    // Execute jobs
    const promises = siteProfiles.map((site) => {
      return pool
        .addJob(
          site.id,
          site.name,
          site,
          async (s) => {
            if (this.isCancelled) throw new Error('Cancelled');

            // Simulate realistic work
            await new Promise((resolve) => setTimeout(resolve, s.baseLatencyMs));

            if (s.behavior === 'TRANSIENT_ERROR') {
              // 40% fail permanently, 60% recover on retry
              if (Math.random() < 0.4) {
                throw new Error('HTTP 504 Gateway Timeout: Competitor origin unreachable');
              }
            }

            const articlesFound = Math.floor(Math.random() * 4);
            const duplicates =
              s.behavior === 'DUPLICATE_HEAVY'
                ? articlesFound + Math.floor(Math.random() * 8) + 2
                : Math.floor(Math.random() * 2);

            return {
              siteId: s.id,
              siteName: s.name,
              strategy: s.strategy,
              durationMs: s.baseLatencyMs,
              articlesFound,
              duplicatesIgnored: duplicates
            };
          },
          { maxRetries: 2, retryDelayMs: 250 }
        )
        .then((res) => {
          this.currentProgress.completed++;
          this.currentProgress.processing = Math.max(0, this.currentProgress.processing - 1);
          this.currentProgress.duplicatesPrevented += res.duplicatesIgnored;
          totalDurations.push(res.durationMs);

          this.updateRecentJobs({
            siteId: res.siteId,
            siteName: res.siteName,
            durationMs: res.durationMs,
            status: 'SUCCESS',
            articlesFound: res.articlesFound,
            duplicatesIgnored: res.duplicatesIgnored,
            strategy: res.strategy
          });
          this.emitProgress();
        })
        .catch((err) => {
          this.currentProgress.failed++;
          this.currentProgress.processing = Math.max(0, this.currentProgress.processing - 1);

          this.updateRecentJobs({
            siteId: site.id,
            siteName: site.name,
            durationMs: site.baseLatencyMs,
            status: 'FAILED',
            articlesFound: 0,
            duplicatesIgnored: 0,
            strategy: site.strategy
          });
          this.emitProgress();
        });
    });

    await Promise.allSettled(promises);

    const endTime = Date.now();
    this.currentProgress.status = this.isCancelled ? 'CANCELLED' : 'COMPLETED';
    this.currentProgress.endTime = endTime;
    this.currentProgress.elapsedSeconds = Number(((endTime - startTime) / 1000).toFixed(2));
    this.currentProgress.processing = 0;
    this.currentProgress.queued = 0;

    if (totalDurations.length > 0) {
      this.currentProgress.avgDurationMs = Math.round(
        totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length
      );
    }

    broadcastEvent('scale-test.progress', this.currentProgress);
    return this.currentProgress;
  }

  private updateRecentJobs(jobItem: ScaleTestProgress['recentJobs'][0]) {
    this.currentProgress.recentJobs.unshift(jobItem);
    if (this.currentProgress.recentJobs.length > 15) {
      this.currentProgress.recentJobs.pop();
    }
  }

  private emitProgress(): void {
    if (this.currentProgress.startTime) {
      this.currentProgress.elapsedSeconds = Number(
        ((Date.now() - this.currentProgress.startTime) / 1000).toFixed(1)
      );
    }
    broadcastEvent('scale-test.progress', this.currentProgress);
  }
}

export const scaleTestEngine = new ScaleTestEngine();
