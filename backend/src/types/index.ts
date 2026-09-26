export type DetectionStrategy = 'RSS' | 'SITEMAP' | 'DIRECT_PAGE';

export interface DiscoveredSource {
  type: DetectionStrategy;
  url: string;
  status: 'ACTIVE' | 'BLOCKED' | 'ERROR' | 'DISCOVERED';
  metadata?: Record<string, any>;
}

export interface WebsiteAnalysisResult {
  websiteUrl: string;
  blogUrl: string | null;
  rssFound: boolean;
  rssUrl: string | null;
  rssVersion?: string;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  sitemapCount?: number;
  blogPageFound: boolean;
  articlePatternDetected: boolean;
  articleUrlPattern?: string;
  metadataFound: boolean;
  metadataTypes: string[];
  publicationDateFound: boolean;
  canonicalUrlFound: boolean;
  recommendedPrimaryStrategy: DetectionStrategy;
  recommendedSecondaryStrategy: DetectionStrategy | null;
  recommendedFallbackStrategy: DetectionStrategy | null;
  strategyRationale: string;
  analysisSteps: {
    step: number;
    title: string;
    status: 'pending' | 'success' | 'warning' | 'failed';
    details: string;
    timestamp: string;
  }[];
}

export interface RawDetectedArticle {
  title: string;
  url: string;
  canonicalUrl?: string;
  publishedAt?: Date;
  guid?: string;
  author?: string;
  summary?: string;
  strategy: DetectionStrategy;
  rawItem?: any;
}

export interface ExtractedArticleData {
  title: string;
  canonicalUrl: string;
  originalUrl: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  inlineImages: string[];
  author?: string;
  publishedAt: Date;
  metaDescription?: string;
  categories: string[];
  tags: string[];
  relevantLinks: string[];
  structuredData?: any;
  contentHash: string;
}

export interface MonitoringCycleResult {
  competitorId: string;
  strategy: DetectionStrategy;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  urlsChecked: number;
  articlesFound: number;
  newArticles: number;
  duplicatesIgnored: number;
  httpStatus?: number;
  errorMessage?: string;
  retryCount: number;
  detectedArticles: Array<{
    id: string;
    title: string;
    detectionDelaySeconds: number;
    delayFormatted: string;
    isWithinTarget: boolean;
  }>;
}

export interface ScaleTestConfig {
  siteCount: number;
  concurrency: number;
  simulatedSlowDelayMs?: number;
  errorRatePercentage?: number;
  duplicateRatePercentage?: number;
}

export interface ScaleTestProgress {
  testId: string;
  totalSites: number;
  concurrency: number;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  retries: number;
  duplicatesPrevented: number;
  avgDurationMs: number;
  peakConcurrency: number;
  startTime: number | null;
  endTime: number | null;
  elapsedSeconds: number;
  recentJobs: Array<{
    siteId: string;
    siteName: string;
    durationMs: number;
    status: 'SUCCESS' | 'FAILED' | 'RETRY';
    articlesFound: number;
    duplicatesIgnored: number;
    strategy: string;
  }>;
}
