import { EventEmitter } from 'events';

export interface Job<T = any, R = any> {
  id: string;
  name: string;
  data: T;
  retries: number;
  maxRetries: number;
  retryDelayMs: number;
  priority?: number;
  execute: (data: T) => Promise<R>;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: R;
}

export class WorkerPool extends EventEmitter {
  private queue: Job[] = [];
  private activeWorkers = 0;
  private concurrency: number;
  private isPaused = false;
  private stats = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    peakActive: 0
  };

  constructor(concurrency: number = 10) {
    super();
    this.concurrency = concurrency;
  }

  setConcurrency(limit: number): void {
    this.concurrency = Math.max(1, limit);
    this.processNext();
  }

  getConcurrency(): number {
    return this.concurrency;
  }

  pause(): void {
    this.isPaused = true;
    this.emit('paused');
  }

  resume(): void {
    this.isPaused = false;
    this.emit('resumed');
    this.processNext();
  }

  getStats() {
    return {
      concurrency: this.concurrency,
      queued: this.queue.length,
      active: this.activeWorkers,
      isPaused: this.isPaused,
      ...this.stats
    };
  }

  addJob<T, R>(
    id: string,
    name: string,
    data: T,
    execute: (data: T) => Promise<R>,
    options: { maxRetries?: number; retryDelayMs?: number } = {}
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const job: Job<T, R> = {
        id,
        name,
        data,
        retries: 0,
        maxRetries: options.maxRetries ?? 2,
        retryDelayMs: options.retryDelayMs ?? 1000,
        execute,
        status: 'QUEUED'
      };

      // Internal callback resolution
      const handleComplete = (completedJob: Job) => {
        if (completedJob.id === id) {
          this.off('job:completed', handleComplete);
          this.off('job:failed', handleFailed);
          resolve(completedJob.result as R);
        }
      };

      const handleFailed = (failedJob: Job, err: any) => {
        if (failedJob.id === id) {
          this.off('job:completed', handleComplete);
          this.off('job:failed', handleFailed);
          reject(err);
        }
      };

      this.on('job:completed', handleComplete);
      this.on('job:failed', handleFailed);

      this.queue.push(job);
      this.emit('job:queued', job);
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.isPaused) return;

    while (this.activeWorkers < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeWorkers++;
      this.stats.peakActive = Math.max(this.stats.peakActive, this.activeWorkers);
      job.status = 'RUNNING';
      job.startedAt = new Date();
      this.emit('job:started', job);

      this.runJob(job);
    }
  }

  private async runJob(job: Job): Promise<void> {
    try {
      const result = await job.execute(job.data);
      job.result = result;
      job.status = 'COMPLETED';
      job.completedAt = new Date();
      this.stats.successful++;
      this.stats.totalProcessed++;
      this.emit('job:completed', job);
    } catch (err: any) {
      if (job.retries < job.maxRetries) {
        job.retries++;
        this.stats.retried++;
        const backoffMs = job.retryDelayMs * Math.pow(2, job.retries - 1);
        job.status = 'QUEUED';
        this.emit('job:retry', job, backoffMs);

        setTimeout(() => {
          this.queue.unshift(job); // re-queue with priority
          this.processNext();
        }, backoffMs);
      } else {
        job.status = 'FAILED';
        job.completedAt = new Date();
        job.error = err?.message || String(err);
        this.stats.failed++;
        this.stats.totalProcessed++;
        this.emit('job:failed', job, err);
      }
    } finally {
      this.activeWorkers--;
      this.processNext();
    }
  }

  clearQueue(): void {
    this.queue = [];
  }
}

export const monitoringWorkerPool = new WorkerPool(10);
