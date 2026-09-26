import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { IContentDetector } from './detectorInterface.js';
import { DetectionStrategy, RawDetectedArticle } from '../types/index.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';

export class SitemapDetector implements IContentDetector {
  public readonly strategy: DetectionStrategy = 'SITEMAP';
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
  }

  async canHandle(url: string): Promise<boolean> {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('sitemap') || lower.endsWith('.xml');
  }

  async detectNewArticles(
    sourceUrl: string,
    knownCanonicalUrls: Set<string>,
    options: { timeoutMs?: number; maxDepth?: number } = {}
  ): Promise<RawDetectedArticle[]> {
    const timeout = options.timeoutMs || 10000;
    const detected: RawDetectedArticle[] = [];
    const visitedSitemaps = new Set<string>();

    const fetchSitemap = async (url: string, depth: number = 0): Promise<void> => {
      if (depth > 2 || visitedSitemaps.has(url)) return;
      visitedSitemaps.add(url);

      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'CompetitorBlogSpy-Bot/1.0 (+https://competitorblogspy.internal/bot)',
          Accept: 'application/xml, text/xml, */*'
        }
      });

      const parsed = this.xmlParser.parse(response.data);

      // 1. Check if this is a sitemapindex pointing to other sitemaps
      if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
        const subSitemaps = Array.isArray(parsed.sitemapindex.sitemap)
          ? parsed.sitemapindex.sitemap
          : [parsed.sitemapindex.sitemap];

        // Prioritize blog/post sitemaps if present
        for (const sub of subSitemaps) {
          const subLoc = sub.loc;
          if (typeof subLoc === 'string' && subLoc.trim()) {
            const lower = subLoc.toLowerCase();
            // If there are many sitemaps, prioritize posts/blogs/news
            if (
              subSitemaps.length <= 5 ||
              lower.includes('post') ||
              lower.includes('blog') ||
              lower.includes('article') ||
              lower.includes('news')
            ) {
              try {
                await fetchSitemap(subLoc.trim(), depth + 1);
              } catch (err) {
                // Continue with other sub-sitemaps
              }
            }
          }
        }
        return;
      }

      // 2. Check standard urlset
      if (parsed.urlset && parsed.urlset.url) {
        const urls = Array.isArray(parsed.urlset.url)
          ? parsed.urlset.url
          : [parsed.urlset.url];

        for (const u of urls) {
          const rawLoc = typeof u.loc === 'string' ? u.loc.trim() : '';
          if (!rawLoc) continue;

          // Exclude root homepages or obvious non-articles if from direct sitemap
          const normalized = normalizeUrl(rawLoc, url);
          if (knownCanonicalUrls.has(normalized)) continue;

          const lastmod = u.lastmod ? new Date(u.lastmod) : new Date();
          const validDate = isNaN(lastmod.getTime()) ? new Date() : lastmod;

          // Generate readable title from slug if title is not in sitemap
          const pathSegments = new URL(normalized).pathname.split('/').filter(Boolean);
          const slug = pathSegments[pathSegments.length - 1] || 'New Publication';
          const inferredTitle = slug
            .replace(/[-_]/g, ' ')
            .replace(/\.html?$/i, '')
            .replace(/\b\w/g, (char) => char.toUpperCase());

          detected.push({
            title: inferredTitle,
            url: rawLoc,
            canonicalUrl: normalized,
            publishedAt: validDate,
            guid: normalized,
            strategy: 'SITEMAP',
            rawItem: u
          });
        }
      }
    };

    await fetchSitemap(sourceUrl, 0);
    return detected;
  }
}
