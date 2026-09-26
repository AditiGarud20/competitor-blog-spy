import { prisma } from './client.js';
import { generateContentHash } from '../utils/contentHasher.js';
import { calculateDelaySeconds } from '../utils/delayCalculator.js';

export async function seedDatabaseIfEmpty(baseUrl: string = 'http://localhost:4000') {
  const competitorCount = await prisma.competitor.count();
  if (competitorCount > 0) {
    return; // Already seeded
  }

  console.log('[Seed] Populating initial competitors and realistic baseline telemetry...');

  // 1. Create Default Admin User
  await prisma.user.create({
    data: {
      email: 'admin@blogspy.io',
      name: 'Intelligence Officer',
      password: 'pbkdf2:demo:password123',
      role: 'ADMIN'
    }
  });

  // 2. Create ApexTech Systems (The live internal demo target)
  const apexTech = await prisma.competitor.create({
    data: {
      name: 'ApexTech Systems',
      websiteUrl: `${baseUrl}/demo-blog`,
      blogUrl: `${baseUrl}/demo-blog`,
      rssUrl: `${baseUrl}/demo-blog/feed.xml`,
      sitemapUrl: `${baseUrl}/demo-blog/sitemap.xml`,
      primaryStrategy: 'RSS',
      secondaryStrategy: 'SITEMAP',
      fallbackStrategy: 'DIRECT_PAGE',
      status: 'ACTIVE',
      enabled: true,
      checkIntervalMinutes: 5,
      averageDelaySeconds: 109 // 1m 49s
    }
  });

  await prisma.monitoringSource.createMany({
    data: [
      { competitorId: apexTech.id, type: 'RSS', url: `${baseUrl}/demo-blog/feed.xml`, status: 'ACTIVE' },
      { competitorId: apexTech.id, type: 'SITEMAP', url: `${baseUrl}/demo-blog/sitemap.xml`, status: 'ACTIVE' },
      { competitorId: apexTech.id, type: 'DIRECT_PAGE', url: `${baseUrl}/demo-blog`, status: 'ACTIVE' }
    ]
  });

  // 3. Create other industry competitors
  const cloudScale = await prisma.competitor.create({
    data: {
      name: 'CloudScale Dynamics',
      websiteUrl: 'https://cloudscale.io',
      blogUrl: 'https://cloudscale.io/engineering',
      rssUrl: 'https://cloudscale.io/rss.xml',
      sitemapUrl: 'https://cloudscale.io/sitemap.xml',
      primaryStrategy: 'RSS',
      secondaryStrategy: 'SITEMAP',
      fallbackStrategy: 'DIRECT_PAGE',
      status: 'ACTIVE',
      enabled: true,
      checkIntervalMinutes: 5,
      averageDelaySeconds: 161 // 2m 41s
    }
  });

  const cyberShield = await prisma.competitor.create({
    data: {
      name: 'CyberShield Labs',
      websiteUrl: 'https://cybershield.security',
      blogUrl: 'https://cybershield.security/threat-intel',
      rssUrl: 'https://cybershield.security/feed',
      primaryStrategy: 'RSS',
      secondaryStrategy: 'DIRECT_PAGE',
      status: 'ACTIVE',
      enabled: true,
      checkIntervalMinutes: 3,
      averageDelaySeconds: 78 // 1m 18s
    }
  });

  const dataMesh = await prisma.competitor.create({
    data: {
      name: 'DataMesh Platform',
      websiteUrl: 'https://datamesh.ai',
      blogUrl: 'https://datamesh.ai/blog',
      sitemapUrl: 'https://datamesh.ai/sitemap.xml',
      primaryStrategy: 'SITEMAP',
      secondaryStrategy: 'DIRECT_PAGE',
      status: 'ACTIVE',
      enabled: true,
      checkIntervalMinutes: 10,
      averageDelaySeconds: 428 // 7m 08s (shows authentic delay > 5m)
    }
  });

  const velocityHq = await prisma.competitor.create({
    data: {
      name: 'VelocityHQ Tech',
      websiteUrl: 'https://velocityhq.com',
      blogUrl: 'https://velocityhq.com/articles',
      primaryStrategy: 'DIRECT_PAGE',
      status: 'ACTIVE',
      enabled: true,
      checkIntervalMinutes: 15,
      averageDelaySeconds: 872 // 14m 32s (shows transparent > 5m measurement)
    }
  });

  // 4. Seed Demo Articles in ApexTech Demo Blog
  const now = new Date();
  const demoArticlesData = [
    {
      title: 'Accelerating Distributed Neural Inference with Vector Quantization',
      slug: 'accelerating-distributed-neural-inference-vq',
      content: `Our machine learning platform team today published benchmarks showing an 8x reduction in KV cache memory footprint. By pairing 4-bit vector quantization with dynamic speculative decoding, GPU memory bandwidth is no longer the critical bottleneck for enterprise LLM clusters.`,
      excerpt: `Benchmarks showing 8x reduction in KV cache memory footprint using dynamic speculative decoding.`,
      author: 'Dr. Aris Thorne',
      featuredImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
      tags: 'AI, Machine Learning, GPU',
      offsetMinutes: 14 // published 14m ago
    },
    {
      title: 'Zero-Trust Microsegmentation at Terabit Scale',
      slug: 'zero-trust-microsegmentation-terabit-scale',
      content: `As multi-tenant cloud fabrics scale beyond tens of thousands of container pods, traditional eBPF filtering rules must be decoupled into localized kernel ringbuffers. We walk through the architecture behind our production zero-trust security mesh.`,
      excerpt: `Decoupling eBPF filtering rules into localized kernel ringbuffers for multi-tenant cloud fabrics.`,
      author: 'Sarah Lin, Staff Security Architect',
      featuredImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      tags: 'Security, Cloud, Kubernetes',
      offsetMinutes: 65 // published 1h 05m ago
    },
    {
      title: 'Real-Time Edge Cache Invalidation Using Durable Streams',
      slug: 'real-time-edge-cache-invalidation-streams',
      content: `Global CDNs often struggle with sub-second cache eviction when data changes at the edge. We present our event-driven replication protocol utilizing persistent append-only logs for deterministic global cache synchronization.`,
      excerpt: `An event-driven replication protocol utilizing persistent append-only logs for deterministic global cache sync.`,
      author: 'Marcus Vance',
      featuredImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      tags: 'Infrastructure, Edge, CDN',
      offsetMinutes: 180 // published 3h ago
    }
  ];

  for (const d of demoArticlesData) {
    const pubDate = new Date(now.getTime() - d.offsetMinutes * 60 * 1000);
    await prisma.demoArticle.create({
      data: {
        title: d.title,
        slug: d.slug,
        content: d.content,
        excerpt: d.excerpt,
        author: d.author,
        featuredImage: d.featuredImage,
        tags: d.tags,
        publishedAt: pubDate
      }
    });
  }

  // 5. Seed Real Detected Articles with Exact Detection Delays
  const baselineArticles = [
    {
      competitor: apexTech,
      title: 'Accelerating Distributed Neural Inference with Vector Quantization',
      url: `${baseUrl}/demo-blog/article/accelerating-distributed-neural-inference-vq`,
      content: `Our machine learning platform team today published benchmarks showing an 8x reduction in KV cache memory footprint. By pairing 4-bit vector quantization with dynamic speculative decoding, GPU memory bandwidth is no longer the critical bottleneck for enterprise LLM clusters.`,
      author: 'Dr. Aris Thorne',
      featuredImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
      minutesAgo: 14,
      delaySeconds: 109, // 1m 49s (<= 5m target)
      method: 'RSS',
      categories: ['Artificial Intelligence', 'Infrastructure']
    },
    {
      competitor: cloudScale,
      title: 'Autonomous Multi-Cloud Failover Orchestration',
      url: 'https://cloudscale.io/engineering/autonomous-multi-cloud-failover',
      content: `In high availability architectures spanning AWS and GCP, DNS TTL latency historically added 60 seconds of downtime. CloudScale is announcing our BGP anycast automatic route switcher that accomplishes cross-cloud failover in under 400 milliseconds.`,
      author: 'David Zhang',
      featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
      minutesAgo: 38,
      delaySeconds: 161, // 2m 41s (<= 5m target)
      method: 'RSS',
      categories: ['Cloud Architecture', 'DevOps']
    },
    {
      competitor: cyberShield,
      title: 'Zero-Day Vulnerability Disclosure: CVE-2026-4821 Memory Corruption in TLS Handshake',
      url: 'https://cybershield.security/threat-intel/cve-2026-4821-tls',
      content: `CyberShield Threat Research Labs discovered an active memory exploitation vector targeting legacy crypto libraries. Attackers can trigger heap corruption prior to session key negotiation. Patch release candidate v2.4 is available immediately.`,
      author: 'Agent K, Principal Cryptanalyst',
      featuredImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      minutesAgo: 85,
      delaySeconds: 18, // 18s (Fastest detection!)
      method: 'RSS',
      categories: ['Cybersecurity', 'Threat Intelligence']
    },
    {
      competitor: dataMesh,
      title: 'Unified Lakehouse Query Planning over Parquet and Iceberg',
      url: 'https://datamesh.ai/blog/lakehouse-query-planning-iceberg',
      content: `Modern enterprise data stacks suffer from compute fragmentation when querying heterogeneous table formats. Our new cost-based vector optimizer unifies metadata parsing, reducing scan times across PB-scale analytical partitions by 65%.`,
      author: 'Priya Sharma',
      featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      minutesAgo: 140,
      delaySeconds: 428, // 7m 08s (> 5m target: clearly visible and unrounded!)
      method: 'SITEMAP',
      categories: ['Big Data', 'Database Engines']
    },
    {
      competitor: velocityHq,
      title: 'Product-Led Growth Playbook: How We Scaled Developer Signups 400%',
      url: 'https://velocityhq.com/articles/product-led-growth-playbook',
      content: `Frictionless onboarding and CLI-first authentication transformed our self-serve funnel. In this teardown, we share our A/B test results on interactive terminal tutorials and live code sandbox previews.`,
      author: 'Alexander Cole',
      featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      minutesAgo: 210,
      delaySeconds: 872, // 14m 32s (Slowest detection: unrounded!)
      method: 'DIRECT_PAGE',
      categories: ['Product Strategy', 'Growth Marketing']
    }
  ];

  for (const b of baselineArticles) {
    const publishedAt = new Date(now.getTime() - b.minutesAgo * 60 * 1000);
    const detectedAt = new Date(publishedAt.getTime() + b.delaySeconds * 1000);
    const contentHash = generateContentHash(b.title, b.content);

    const art = await prisma.article.create({
      data: {
        competitorId: b.competitor.id,
        title: b.title,
        canonicalUrl: b.url,
        originalUrl: b.url,
        content: b.content,
        excerpt: b.content.slice(0, 180) + '...',
        author: b.author,
        featuredImage: b.featuredImage,
        inlineImages: JSON.stringify([b.featuredImage]),
        publishedAt,
        detectedAt,
        detectionDelaySeconds: b.delaySeconds,
        categories: JSON.stringify(b.categories),
        tags: JSON.stringify(b.categories),
        relevantLinks: JSON.stringify([b.url]),
        contentHash,
        status: 'DETECTED',
        firstDetectedMethod: b.method,
        detectedMethods: JSON.stringify([b.method])
      }
    });

    // Create Detection Event
    await prisma.detectionEvent.create({
      data: {
        articleId: art.id,
        competitorId: b.competitor.id,
        method: b.method,
        checkedAt: new Date(detectedAt.getTime() - 2000),
        detectedAt,
        publishedAt,
        delaySeconds: b.delaySeconds
      }
    });

    // Create Notification
    const isWithin = b.delaySeconds <= 300;
    await prisma.notification.create({
      data: {
        type: isWithin ? 'TARGET_MET' : 'TARGET_EXCEEDED',
        title: `New Article: ${b.competitor.name}`,
        message: `"${b.title}" detected via ${b.method}. Delay: ${Math.floor(b.delaySeconds / 60)}m ${b.delaySeconds % 60}s (${isWithin ? 'Within 5m target' : 'Exceeded target'}).`,
        competitorId: b.competitor.id,
        articleId: art.id,
        delaySeconds: b.delaySeconds,
        method: b.method,
        createdAt: detectedAt
      }
    });

    // Create Monitoring Check Record
    await prisma.monitoringCheck.create({
      data: {
        competitorId: b.competitor.id,
        strategy: b.method,
        startedAt: new Date(detectedAt.getTime() - 2000),
        completedAt: detectedAt,
        durationMs: 1420,
        status: 'SUCCESS',
        urlsChecked: 1,
        articlesFound: 1,
        newArticles: 1,
        duplicatesIgnored: 3,
        httpStatus: 200,
        createdAt: detectedAt
      }
    });
  }

  // Update competitor counts
  for (const comp of [apexTech, cloudScale, cyberShield, dataMesh, velocityHq]) {
    const count = await prisma.article.count({ where: { competitorId: comp.id } });
    await prisma.competitor.update({
      where: { id: comp.id },
      data: { articlesCount: count }
    });
  }

  console.log('[Seed] Database initialization complete.');
}
