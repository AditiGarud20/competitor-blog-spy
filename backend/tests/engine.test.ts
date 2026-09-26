import { describe, it, expect } from 'vitest';
import { normalizeUrl, isSameArticleUrl } from '../src/utils/urlNormalizer.js';
import { generateContentHash } from '../src/utils/contentHasher.js';
import {
  calculateDelaySeconds,
  formatExactDelay,
  isDelayWithinTarget
} from '../src/utils/delayCalculator.js';
import { WorkerPool } from '../src/queue/workerPool.js';
import { RSSDetector } from '../src/detectors/rssDetector.js';
import { SitemapDetector } from '../src/detectors/sitemapDetector.js';

describe('1. URL Normalization Engine', () => {
  it('strips tracking parameters and utm tags', () => {
    const raw = 'https://example.com/blog/ai-trends?utm_source=twitter&utm_medium=social&utm_campaign=launch#comments';
    const normalized = normalizeUrl(raw);
    expect(normalized).toBe('https://example.com/blog/ai-trends');
  });

  it('strips trailing slashes correctly', () => {
    expect(normalizeUrl('https://example.com/blog/post-1/')).toBe('https://example.com/blog/post-1');
  });

  it('resolves relative paths against base url', () => {
    expect(normalizeUrl('/posts/new-feature', 'https://apextech.com')).toBe('https://apextech.com/posts/new-feature');
  });

  it('identifies identical articles with different query strings', () => {
    const url1 = 'https://example.com/post?ref=newsletter';
    const url2 = 'https://example.com/post?utm_content=footer';
    expect(isSameArticleUrl(url1, url2)).toBe(true);
  });
});

describe('2. Deduplication & Content Hashing', () => {
  it('generates consistent SHA-256 content hashes regardless of spacing or case', () => {
    const hash1 = generateContentHash('New AI Model Released', 'This is the body content.');
    const hash2 = generateContentHash('new ai model released ', 'This   is the body content.  ');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for distinct content', () => {
    const hash1 = generateContentHash('Title A', 'Content Alpha');
    const hash2 = generateContentHash('Title B', 'Content Beta');
    expect(hash1).not.toBe(hash2);
  });
});

describe('3. Exact Detection Delay Calculations', () => {
  it('calculates exact delay in seconds', () => {
    const published = new Date('2026-09-26T10:00:00Z');
    const detected = new Date('2026-09-26T10:03:12Z');
    expect(calculateDelaySeconds(published, detected)).toBe(192); // 3m 12s
  });

  it('formats delays accurately without rounding (unrounded display)', () => {
    expect(formatExactDelay(18)).toBe('18s');
    expect(formatExactDelay(109)).toBe('1m 49s');
    expect(formatExactDelay(428)).toBe('7m 08s'); // NEVER rounded to 7m!
    expect(formatExactDelay(872)).toBe('14m 32s');
    expect(formatExactDelay(3871)).toBe('1h 04m 31s');
  });

  it('enforces 5-minute (300 seconds) target boundary', () => {
    expect(isDelayWithinTarget(109)).toBe(true);  // 1m 49s <= 5m
    expect(isDelayWithinTarget(300)).toBe(true);  // 5m exact <= 5m
    expect(isDelayWithinTarget(301)).toBe(false); // 5m 01s > 5m
    expect(isDelayWithinTarget(428)).toBe(false); // 7m 08s > 5m
  });
});

describe('4. Worker Pool & Concurrency', () => {
  it('processes jobs concurrently up to concurrency limit', async () => {
    const pool = new WorkerPool(3);
    let peakConcurrency = 0;
    let active = 0;

    const tasks = Array.from({ length: 6 }, (_, i) =>
      pool.addJob(`job-${i}`, `Job ${i}`, i, async () => {
        active++;
        peakConcurrency = Math.max(peakConcurrency, active);
        await new Promise((r) => setTimeout(r, 40));
        active--;
        return i * 2;
      })
    );

    const results = await Promise.all(tasks);
    expect(results).toEqual([0, 2, 4, 6, 8, 10]);
    expect(peakConcurrency).toBeLessThanOrEqual(3);
  });

  it('retries failing jobs with exponential backoff before final rejection', async () => {
    const pool = new WorkerPool(2);
    let attempts = 0;

    await expect(
      pool.addJob(
        'retry-job',
        'Retry Task',
        null,
        async () => {
          attempts++;
          throw new Error('Temporary 503 Server Error');
        },
        { maxRetries: 2, retryDelayMs: 20 }
      )
    ).rejects.toThrow('Temporary 503 Server Error');

    expect(attempts).toBe(3); // Initial attempt + 2 retries
  });
});

describe('5. Detectors canHandle Checks', () => {
  it('RSSDetector identifies feed URLs', async () => {
    const detector = new RSSDetector();
    expect(await detector.canHandle('https://techcrunch.com/feed/')).toBe(true);
    expect(await detector.canHandle('https://venturebeat.com/rss.xml')).toBe(true);
  });

  it('SitemapDetector identifies XML sitemap endpoints', async () => {
    const detector = new SitemapDetector();
    expect(await detector.canHandle('https://stripe.com/sitemap.xml')).toBe(true);
    expect(await detector.canHandle('https://netflixtechblog.com/sitemap_index.xml')).toBe(true);
  });
});
