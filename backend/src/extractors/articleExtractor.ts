import axios from 'axios';
import * as cheerio from 'cheerio';
import { ExtractedArticleData } from '../types/index.js';
import { normalizeUrl } from '../utils/urlNormalizer.js';
import { generateContentHash } from '../utils/contentHasher.js';

export class ArticleExtractor {
  async extractFromUrl(
    articleUrl: string,
    fallbackTitle?: string,
    fallbackPublishedAt?: Date
  ): Promise<ExtractedArticleData> {
    try {
      const response = await axios.get(articleUrl, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CompetitorBlogSpy/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const $ = cheerio.load(response.data);

      // Canonical URL
      const canonicalTag = $('link[rel="canonical"]').attr('href');
      const canonicalUrl = canonicalTag
        ? normalizeUrl(canonicalTag, articleUrl)
        : normalizeUrl(articleUrl);

      // Title
      const ogTitle = $('meta[property="og:title"]').attr('content');
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      const h1Title = $('h1').first().text().trim();
      const docTitle = $('title').text().trim();
      const title =
        ogTitle ||
        twitterTitle ||
        h1Title ||
        fallbackTitle ||
        docTitle ||
        'Untitled Article';

      // Meta Description
      const metaDescription =
        $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        undefined;

      // Featured Image
      const ogImage =
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('article img').first().attr('src') ||
        undefined;
      const featuredImage = ogImage ? normalizeUrl(ogImage, articleUrl) : undefined;

      // Author
      let author: string | undefined =
        $('meta[name="author"]').attr('content') ||
        $('meta[property="article:author"]').attr('content') ||
        $('[rel="author"]').first().text().trim() ||
        $('.author').first().text().trim() ||
        $('[class*="byline"]').first().text().trim();

      // Publication Date
      let publishedAt: Date = fallbackPublishedAt ? new Date(fallbackPublishedAt) : new Date();
      const metaDate =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="publish-date"]').attr('content') ||
        $('meta[name="date"]').attr('content') ||
        $('time[datetime]').first().attr('datetime');

      if (metaDate) {
        const parsed = new Date(metaDate);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed;
        }
      }

      // JSON-LD structured data parsing
      let structuredData: any = undefined;
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const raw = $(el).html();
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed['@type'] === 'Article' ||
              parsed['@type'] === 'BlogPosting' ||
              parsed['@type'] === 'NewsArticle' ||
              Array.isArray(parsed['@graph'])
            ) {
              structuredData = parsed;
              if (!author && parsed.author) {
                author = typeof parsed.author === 'string' ? parsed.author : parsed.author.name;
              }
              if (parsed.datePublished && isNaN(publishedAt.getTime())) {
                const p = new Date(parsed.datePublished);
                if (!isNaN(p.getTime())) publishedAt = p;
              }
            }
          }
        } catch {
          // ignore malformed JSON-LD
        }
      });

      // Categories and Tags
      const tags: string[] = [];
      const categories: string[] = [];

      $('meta[property="article:tag"]').each((_, el) => {
        const t = $(el).attr('content');
        if (t && !tags.includes(t)) tags.push(t);
      });

      $('a[rel="tag"], .tags a, .tag a, [class*="tag"]').each((_, el) => {
        const text = $(el).text().trim().replace(/^#/, '');
        if (text && text.length < 30 && !tags.includes(text)) {
          tags.push(text);
        }
      });

      $('a[href*="/category/"], .category a, [class*="category"]').each((_, el) => {
        const cat = $(el).text().trim();
        if (cat && cat.length < 30 && !categories.includes(cat)) {
          categories.push(cat);
        }
      });

      // Content & Inline Images extraction
      let contentContainer = $('article');
      if (contentContainer.length === 0) {
        contentContainer = $(
          '.post-content, .article-content, .entry-content, main, [role="main"]'
        ).first();
      }

      const inlineImages: string[] = [];
      const relevantLinks: string[] = [];

      if (contentContainer.length > 0) {
        contentContainer.find('img').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src) {
            const fullImg = normalizeUrl(src, articleUrl);
            if (!inlineImages.includes(fullImg)) inlineImages.push(fullImg);
          }
        });

        contentContainer.find('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            const fullLink = normalizeUrl(href, articleUrl);
            if (!relevantLinks.includes(fullLink) && relevantLinks.length < 20) {
              relevantLinks.push(fullLink);
            }
          }
        });
      }

      // Clean text content
      let content = contentContainer.text().replace(/\s+/g, ' ').trim();
      if (!content || content.length < 50) {
        // Fallback to body text minus scripts and styles
        $('script, style, noscript, nav, header, footer, iframe').remove();
        content = $('body').text().replace(/\s+/g, ' ').trim();
      }

      const excerpt = metaDescription || content.slice(0, 280) + '...';
      const contentHash = generateContentHash(title, content);

      return {
        title,
        canonicalUrl,
        originalUrl: articleUrl,
        content: content || 'Content extracted from original source.',
        excerpt,
        featuredImage,
        inlineImages: inlineImages.slice(0, 10),
        author: author || 'Editorial Staff',
        publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
        metaDescription,
        categories: categories.slice(0, 5),
        tags: tags.slice(0, 8),
        relevantLinks: relevantLinks.slice(0, 15),
        structuredData,
        contentHash
      };
    } catch (err: any) {
      // Graceful fallback when remote extraction is hindered
      const fallbackCanonical = normalizeUrl(articleUrl);
      const fallbackText = fallbackTitle || 'Detected Article Publication';
      return {
        title: fallbackText,
        canonicalUrl: fallbackCanonical,
        originalUrl: articleUrl,
        content: `Article detected via monitoring feed. Full scraping returned: ${err.message || 'Restricted / timeout'}. Canonical source retained.`,
        excerpt: `Article detected from ${articleUrl}`,
        inlineImages: [],
        author: 'Unknown Author',
        publishedAt: fallbackPublishedAt || new Date(),
        categories: ['Technology'],
        tags: ['Competitor Intelligence'],
        relevantLinks: [articleUrl],
        contentHash: generateContentHash(fallbackText, articleUrl)
      };
    }
  }
}
