import axios from 'axios';
import * as cheerio from 'cheerio';
import { IContentDetector } from './detectorInterface.js';
import { DetectionStrategy, RawDetectedArticle } from '../types/index.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';

export class DirectPageDetector implements IContentDetector {
  public readonly strategy: DetectionStrategy = 'DIRECT_PAGE';

  async canHandle(url: string): Promise<boolean> {
    return Boolean(url && (url.startsWith('http://') || url.startsWith('https://')));
  }

  async detectNewArticles(
    sourceUrl: string,
    knownCanonicalUrls: Set<string>,
    options: { timeoutMs?: number } = {}
  ): Promise<RawDetectedArticle[]> {
    const timeout = options.timeoutMs || 10000;
    const detected: RawDetectedArticle[] = [];

    const response = await axios.get(sourceUrl, {
      timeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CompetitorBlogSpy/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const $ = cheerio.load(response.data);
    const seenOnPage = new Set<string>();

    // Structural candidate containers
    const candidateContainers = [
      'article',
      '.post',
      '.article',
      '.blog-post',
      '.blog-entry',
      '.card',
      'li:has(h2, h3)',
      'div[class*="article"]',
      'div[class*="post"]',
      'div[class*="blog"]'
    ];

    let foundContainers = false;

    for (const selector of candidateContainers) {
      const elements = $(selector);
      if (elements.length > 0) {
        foundContainers = true;
        elements.each((_, el) => {
          const container = $(el);
          const linkEl = container.find('a[href]').first();
          const href = linkEl.attr('href');
          if (!href) return;

          const headingEl = container.find('h1, h2, h3, h4, .title, [class*="title"]').first();
          const title = headingEl.text().trim() || linkEl.text().trim();
          if (!title || title.length < 5) return;

          const normalized = normalizeUrl(href, sourceUrl);
          if (seenOnPage.has(normalized) || knownCanonicalUrls.has(normalized)) return;
          seenOnPage.add(normalized);

          // Extract date heuristic
          const timeEl = container.find('time, [datetime], .date, [class*="date"]').first();
          let pubDate = new Date();
          const dtAttr = timeEl.attr('datetime') || timeEl.attr('data-date');
          if (dtAttr) {
            const parsed = new Date(dtAttr);
            if (!isNaN(parsed.getTime())) pubDate = parsed;
          } else if (timeEl.text().trim()) {
            const parsed = new Date(timeEl.text().trim());
            if (!isNaN(parsed.getTime())) pubDate = parsed;
          }

          detected.push({
            title,
            url: href,
            canonicalUrl: normalized,
            publishedAt: pubDate,
            guid: normalized,
            summary: container.find('p').first().text().trim() || undefined,
            strategy: 'DIRECT_PAGE'
          });
        });

        if (detected.length > 0) {
          break; // Good container selector matched
        }
      }
    }

    // Fallback: heuristic scan of all anchor links matching typical blog/article patterns
    if (detected.length === 0) {
      $('a[href]').each((_, el) => {
        const link = $(el);
        const href = link.attr('href');
        const text = link.text().trim();

        if (!href || !text || text.length < 15) return;

        // Article URL path heuristic
        const lowerHref = href.toLowerCase();
        const isLikelyArticle =
          lowerHref.includes('/blog/') ||
          lowerHref.includes('/article/') ||
          lowerHref.includes('/posts/') ||
          lowerHref.includes('/news/') ||
          /\/\d{4}\/\d{2}\//.test(lowerHref);

        if (isLikelyArticle) {
          const normalized = normalizeUrl(href, sourceUrl);
          if (!seenOnPage.has(normalized) && !knownCanonicalUrls.has(normalized)) {
            seenOnPage.add(normalized);
            detected.push({
              title: text,
              url: href,
              canonicalUrl: normalized,
              publishedAt: new Date(),
              guid: normalized,
              strategy: 'DIRECT_PAGE'
            });
          }
        }
      });
    }

    return detected;
  }
}
