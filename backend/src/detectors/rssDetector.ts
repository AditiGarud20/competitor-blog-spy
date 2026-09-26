import Parser from 'rss-parser';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { IContentDetector } from './detectorInterface.js';
import { DetectionStrategy, RawDetectedArticle } from '../types/index.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';

export class RSSDetector implements IContentDetector {
  public readonly strategy: DetectionStrategy = 'RSS';
  private parser: Parser;
  private xmlParser: XMLParser;

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'CompetitorBlogSpy-Bot/1.0 (+https://competitorblogspy.internal/bot)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
      }
    });

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async canHandle(url: string): Promise<boolean> {
    if (!url) return false;
    const lower = url.toLowerCase();
    if (lower.includes('rss') || lower.includes('feed') || lower.endsWith('.xml')) {
      return true;
    }

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'CompetitorBlogSpy-Bot/1.0' }
      });
      const contentType = response.headers['content-type'] || '';
      return (
        contentType.includes('xml') ||
        contentType.includes('rss') ||
        contentType.includes('atom') ||
        (typeof response.data === 'string' &&
          (response.data.includes('<rss') || response.data.includes('<feed')))
      );
    } catch {
      return false;
    }
  }

  async detectNewArticles(
    sourceUrl: string,
    knownCanonicalUrls: Set<string>,
    options: { timeoutMs?: number } = {}
  ): Promise<RawDetectedArticle[]> {
    const detected: RawDetectedArticle[] = [];
    const timeout = options.timeoutMs || 10000;

    try {
      // Primary attempt with rss-parser
      const feed = await this.parser.parseURL(sourceUrl);

      if (feed && feed.items && feed.items.length > 0) {
        for (const item of feed.items) {
          const rawLink = item.link || item.guid || '';
          if (!rawLink) continue;

          const normalized = normalizeUrl(rawLink, sourceUrl);
          if (knownCanonicalUrls.has(normalized)) {
            continue; // Known duplicate
          }

          let publishedAt: Date;
          if (item.isoDate) {
            publishedAt = new Date(item.isoDate);
          } else if (item.pubDate) {
            publishedAt = new Date(item.pubDate);
          } else {
            publishedAt = new Date();
          }

          detected.push({
            title: item.title || 'Untitled Article',
            url: rawLink,
            canonicalUrl: normalized,
            publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
            guid: item.guid || item.id || normalized,
            author: item.creator || item.author || undefined,
            summary: item.contentSnippet || item.content || undefined,
            strategy: 'RSS',
            rawItem: item
          });
        }
        return detected;
      }
    } catch (primaryErr) {
      // Fallback to fast-xml-parser if rss-parser faces odd feed formatting
      try {
        const response = await axios.get(sourceUrl, {
          timeout,
          headers: {
            'User-Agent': 'CompetitorBlogSpy-Bot/1.0',
            Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
          }
        });

        const xmlData = this.xmlParser.parse(response.data);
        const channel = xmlData.rss?.channel || xmlData.feed;

        if (channel) {
          const items = channel.item || channel.entry || [];
          const itemsArray = Array.isArray(items) ? items : [items];

          for (const item of itemsArray) {
            const rawLink =
              item.link?.['@_href'] ||
              (typeof item.link === 'string' ? item.link : '') ||
              item.guid?.['#text'] ||
              item.guid ||
              '';

            if (!rawLink) continue;
            const normalized = normalizeUrl(rawLink, sourceUrl);
            if (knownCanonicalUrls.has(normalized)) continue;

            const pubDateStr =
              item.pubDate || item.published || item.updated || item['dc:date'];
            const publishedAt = pubDateStr ? new Date(pubDateStr) : new Date();

            detected.push({
              title: item.title?.['#text'] || item.title || 'Untitled Article',
              url: rawLink,
              canonicalUrl: normalized,
              publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
              guid: item.guid?.['#text'] || item.id || normalized,
              author: item['dc:creator'] || item.author?.name || undefined,
              summary: item.description || item.summary || undefined,
              strategy: 'RSS',
              rawItem: item
            });
          }
        }
      } catch (fallbackErr: any) {
        throw new Error(
          `RSS detection failed for ${sourceUrl}: ${primaryErr instanceof Error ? primaryErr.message : String(primaryErr)}`
        );
      }
    }

    return detected;
  }
}
