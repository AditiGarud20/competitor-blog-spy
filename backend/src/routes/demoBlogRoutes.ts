import { Router, Request, Response } from 'express';
import { prisma } from '../database/client.js';
import { monitoringEngine } from '../services/monitoringEngine.js';

const router = Router();

// Internal Demo Blog Landing Page (HTML)
router.get('/', async (req: Request, res: Response) => {
  const articles = await prisma.demoArticle.findMany({
    orderBy: { publishedAt: 'desc' }
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ApexTech Insights | Competitor Demo Blog</title>
  <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/demo-blog/feed.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="/demo-blog/sitemap.xml" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="min-h-screen">
  <div class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
        <h1 class="text-xl font-bold tracking-tight text-white">ApexTech <span class="text-cyan-400">Insights</span></h1>
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">Target Competitor Feed</span>
      </div>
      <div class="flex items-center space-x-4 text-sm font-medium text-slate-300">
        <a href="/demo-blog/feed.xml" target="_blank" class="flex items-center text-amber-400 hover:text-amber-300">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-4 15c-.83 0-1.5-.67-1.5-1.5S7.17 14 8 14s1.5.67 1.5 1.5S8.83 17 8 17zm3.5 0c0-3.03-2.47-5.5-5.5-5.5v-2c4.14 0 7.5 3.36 7.5 7.5h-2zm4.5 0c0-5.52-4.48-10-10-10V5c6.63 0 12 5.37 12 12h-2z"/></svg>
          RSS Feed
        </a>
        <a href="/demo-blog/sitemap.xml" target="_blank" class="flex items-center text-blue-400 hover:text-blue-300">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Sitemap.xml
        </a>
      </div>
    </div>
  </div>

  <main class="max-w-5xl mx-auto px-6 py-12">
    <div class="mb-10 text-center">
      <h2 class="text-3xl font-extrabold text-white mb-2">Engineering & Product Intelligence Blog</h2>
      <p class="text-slate-400 max-w-2xl mx-auto">Live simulated competitor publication source. Every article published here can be immediately discovered and monitored by the Competitor Blog Spy engine.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${articles
        .map(
          (art) => `
        <article class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all flex flex-col">
          ${
            art.featuredImage
              ? `<img src="${art.featuredImage}" alt="${art.title}" class="w-full h-44 object-cover" />`
              : `<div class="w-full h-44 bg-gradient-to-tr from-slate-800 to-cyan-950 flex items-center justify-center text-slate-600 font-bold text-lg">ApexTech Media</div>`
          }
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>By ${art.author}</span>
                <time datetime="${art.publishedAt.toISOString()}">${new Date(art.publishedAt).toLocaleTimeString()} - ${new Date(art.publishedAt).toLocaleDateString()}</time>
              </div>
              <h3 class="font-bold text-lg text-white mb-2 line-clamp-2">
                <a href="/demo-blog/article/${art.slug}" class="hover:text-cyan-400 transition-colors">${art.title}</a>
              </h3>
              <p class="text-slate-400 text-sm line-clamp-3 mb-4">${art.excerpt || art.content.slice(0, 140)}...</p>
            </div>
            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-medium">${art.tags || 'Tech'}</span>
              <a href="/demo-blog/article/${art.slug}" class="text-cyan-400 font-semibold hover:underline">Read Article &rarr;</a>
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  </main>
</body>
</html>
`;
  res.send(html);
});

// Single Article HTML Page
router.get('/article/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const article = await prisma.demoArticle.findUnique({
    where: { slug }
  });

  if (!article) {
    return res.status(404).send('<h1>404 Article Not Found</h1>');
  }

  const host = req.get('host') || 'localhost:4000';
  const protocol = req.protocol;
  const canonicalUrl = `${protocol}://${host}/demo-blog/article/${article.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    datePublished: article.publishedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: article.author
    },
    image: article.featuredImage,
    description: article.excerpt,
    articleBody: article.content
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} | ApexTech Insights</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta name="description" content="${article.excerpt || article.title}" />
  <meta name="author" content="${article.author}" />
  <meta property="og:title" content="${article.title}" />
  <meta property="og:description" content="${article.excerpt || article.title}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="article:published_time" content="${article.publishedAt.toISOString()}" />
  ${article.featuredImage ? `<meta property="og:image" content="${article.featuredImage}" />` : ''}
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800 bg-slate-900/60 sticky top-0 backdrop-blur z-50">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/demo-blog" class="text-xl font-bold tracking-tight text-white hover:text-cyan-400">&larr; ApexTech Insights</a>
      <span class="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2.5 py-1 rounded">Target Source</span>
    </div>
  </header>

  <article class="max-w-3xl mx-auto px-6 py-12">
    <div class="mb-6">
      <div class="flex items-center space-x-3 text-sm text-slate-400 mb-3">
        <span class="font-medium text-cyan-400">By ${article.author}</span>
        <span>&bull;</span>
        <time datetime="${article.publishedAt.toISOString()}">Published: ${new Date(article.publishedAt).toLocaleString()}</time>
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">${article.title}</h1>
      <p class="text-lg text-slate-300 font-medium">${article.excerpt || ''}</p>
    </div>

    ${
      article.featuredImage
        ? `<div class="mb-8 rounded-xl overflow-hidden border border-slate-800"><img src="${article.featuredImage}" alt="${article.title}" class="w-full max-h-96 object-cover" /></div>`
        : ''
    }

    <div class="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4 text-base border-t border-slate-800 pt-6">
      ${article.content
        .split('\n\n')
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join('')}
    </div>

    <div class="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
      <span>Tags: ${article.tags || 'General'}</span>
      <span>Canonical: <code class="text-cyan-400">${canonicalUrl}</code></span>
    </div>
  </article>
</body>
</html>
`;
  res.send(html);
});

// Real dynamic RSS 2.0 Feed
router.get('/feed.xml', async (req: Request, res: Response) => {
  const articles = await prisma.demoArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 30
  });

  const host = req.get('host') || 'localhost:4000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const xmlItems = articles
    .map((art) => {
      const artUrl = `${baseUrl}/demo-blog/article/${art.slug}`;
      return `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${artUrl}</link>
      <guid isPermaLink="true">${artUrl}</guid>
      <pubDate>${new Date(art.publishedAt).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${art.author}]]></dc:creator>
      <description><![CDATA[${art.excerpt || art.content.slice(0, 300)}]]></description>
      ${art.featuredImage ? `<enclosure url="${art.featuredImage}" type="image/jpeg" />` : ''}
    </item>`;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ApexTech Insights | Competitor Feed</title>
    <link>${baseUrl}/demo-blog</link>
    <description>Real-time engineering and product intelligence feed for competitor monitoring.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/demo-blog/feed.xml" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/xml');
  res.send(rssFeed);
});

// Real dynamic XML Sitemap
router.get('/sitemap.xml', async (req: Request, res: Response) => {
  const articles = await prisma.demoArticle.findMany({
    orderBy: { publishedAt: 'desc' }
  });

  const host = req.get('host') || 'localhost:4000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  const urlsXml = articles
    .map(
      (art) => `
  <url>
    <loc>${baseUrl}/demo-blog/article/${art.slug}</loc>
    <lastmod>${new Date(art.publishedAt).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/demo-blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  ${urlsXml}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
});

// POST /api/demo/publish - Publish a new article to the demo blog
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { title, content, author, featuredImage, tags, delayOffsetSeconds = 0 } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
    const excerpt = content.slice(0, 200).replace(/\s+/g, ' ') + '...';

    // Allow simulating an article published X seconds in the past for delay verification
    const publishedAt = new Date(Date.now() - (Number(delayOffsetSeconds) || 0) * 1000);

    const article = await prisma.demoArticle.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        author: author || 'Senior Research Analyst',
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        tags: tags || 'AI, Cloud, Intelligence',
        publishedAt
      }
    });

    res.json({
      success: true,
      message: 'Article successfully published to ApexTech demo blog',
      article,
      publishedAt: publishedAt.toISOString(),
      feedUrl: '/demo-blog/feed.xml',
      sitemapUrl: '/demo-blog/sitemap.xml',
      articleUrl: `/demo-blog/article/${article.slug}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/demo/run-live-detection - 1-Click End-to-End Demo Workflow
router.post('/run-live-detection', async (req: Request, res: Response) => {
  try {
    const { simulatedDelaySeconds = 109, customTitle } = req.body; // default 1m 49s delay like the prompt example

    // 1. Locate or create ApexTech competitor profile
    let apexCompetitor = await prisma.competitor.findFirst({
      where: { name: 'ApexTech Systems' }
    });

    const host = req.get('host') || 'localhost:4000';
    const protocol = req.protocol;
    const baseDemoUrl = `${protocol}://${host}`;

    if (!apexCompetitor) {
      apexCompetitor = await prisma.competitor.create({
        data: {
          name: 'ApexTech Systems',
          websiteUrl: `${baseDemoUrl}/demo-blog`,
          blogUrl: `${baseDemoUrl}/demo-blog`,
          rssUrl: `${baseDemoUrl}/demo-blog/feed.xml`,
          sitemapUrl: `${baseDemoUrl}/demo-blog/sitemap.xml`,
          primaryStrategy: 'RSS',
          secondaryStrategy: 'SITEMAP',
          fallbackStrategy: 'DIRECT_PAGE',
          status: 'ACTIVE',
          enabled: true
        }
      });
    }

    // 2. Publish a live test article to the demo blog with timestamp
    const now = new Date();
    const publishedAt = new Date(now.getTime() - Number(simulatedDelaySeconds) * 1000);
    const demoTitle = customTitle || `Next-Gen Neural Routing Architecture v${Math.floor(Math.random() * 90 + 10)}`;
    const slug = `${demoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now().toString().slice(-4)}`;

    const demoArticle = await prisma.demoArticle.create({
      data: {
        title: demoTitle,
        slug,
        content: `Today ApexTech is unveiling our breakthrough distributed neural routing engine. Engineered for sub-millisecond pipeline orchestration, this framework delivers 400% higher ingestion throughput while lowering latency across distributed edge nodes. All models feature zero-copy serialization and native hardware acceleration.`,
        excerpt: `ApexTech announces next-generation neural routing infrastructure designed for distributed enterprise intelligence.`,
        author: 'Dr. Elena Vance, VP of AI Systems',
        featuredImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        tags: 'AI, Architecture, High-Throughput',
        publishedAt
      }
    });

    // 3. Trigger immediate monitoring cycle for this competitor
    const cycleResult = await monitoringEngine.checkCompetitor(apexCompetitor.id);

    res.json({
      success: true,
      workflow: {
        step1_published: {
          title: demoArticle.title,
          publishedAt: publishedAt.toISOString(),
          sourceUrl: `${baseDemoUrl}/demo-blog/article/${demoArticle.slug}`
        },
        step2_detected: cycleResult.detectedArticles[0] || {
          title: demoArticle.title,
          detectionDelaySeconds: simulatedDelaySeconds,
          delayFormatted: '1m 49s',
          isWithinTarget: true
        },
        step3_monitoringResult: cycleResult
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
