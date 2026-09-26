import { DetectionStrategy, RawDetectedArticle } from '../types/index.js';

export interface IContentDetector {
  readonly strategy: DetectionStrategy;
  canHandle(url: string): Promise<boolean>;
  detectNewArticles(
    sourceUrl: string,
    knownCanonicalUrls: Set<string>,
    options?: { timeoutMs?: number }
  ): Promise<RawDetectedArticle[]>;
}
