export type DetectionStrategy = 'RSS' | 'SITEMAP' | 'DIRECT_PAGE';

export interface Competitor {
  id: string;
  name: string;
  websiteUrl: string;
  blogUrl?: string | null;
  rssUrl?: string | null;
  sitemapUrl?: string | null;
  enabled: boolean;
  checkIntervalMinutes: number;
  status: 'ACTIVE' | 'PAUSED' | 'ERROR' | 'ANALYZING' | 'TEMPORARILY_UNAVAILABLE';
  primaryStrategy: DetectionStrategy;
  secondaryStrategy?: DetectionStrategy | null;
  fallbackStrategy?: DetectionStrategy | null;
  lastCheckedAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  failureCount: number;
  articlesCount: number;
  averageDelaySeconds?: number | null;
  analysisData?: string | null;
  createdAt: string;
  sources?: MonitoringSource[];
  _count?: {
    articles: number;
    checks: number;
  };
}

export interface MonitoringSource {
  id: string;
  competitorId: string;
  type: DetectionStrategy;
  url: string;
  status: 'ACTIVE' | 'BLOCKED' | 'ERROR' | 'DISCOVERED';
  discoveredAt: string;
  lastCheckedAt?: string | null;
}

export interface Article {
  id: string;
  competitorId: string;
  competitor?: {
    id: string;
    name: string;
    websiteUrl: string;
  };
  title: string;
  canonicalUrl: string;
  originalUrl: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  inlineImages?: string[];
  author?: string;
  publishedAt: string;
  detectedAt: string;
  detectionDelaySeconds: number;
  delayFormatted: string;
  isWithinTarget: boolean;
  metaDescription?: string;
  categories?: string[];
  tags?: string[];
  relevantLinks?: string[];
  structuredData?: any;
  contentHash: string;
  status: string;
  firstDetectedMethod: DetectionStrategy;
  detectedMethodsList?: string[];
  timeline?: {
    stage: string;
    label: string;
    timestamp: string;
    details: string;
  }[];
}

export interface MonitoringLog {
  id: string;
  competitorId: string;
  competitor?: {
    id: string;
    name: string;
    websiteUrl: string;
  };
  strategy: DetectionStrategy;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  urlsChecked: number;
  articlesFound: number;
  newArticles: number;
  duplicatesIgnored: number;
  httpStatus?: number;
  errorMessage?: string;
  retryCount: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  competitorId?: string;
  articleId?: string;
  delaySeconds?: number;
  method?: string;
  read: boolean;
  createdAt: string;
}

export interface WebsiteAnalysisStep {
  step: number;
  title: string;
  status: 'pending' | 'success' | 'warning' | 'failed';
  details: string;
  timestamp: string;
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
  analysisSteps: WebsiteAnalysisStep[];
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
  recentJobs: {
    siteId: string;
    siteName: string;
    durationMs: number;
    status: 'SUCCESS' | 'FAILED' | 'RETRY';
    articlesFound: number;
    duplicatesIgnored: number;
    strategy: string;
  }[];
}
