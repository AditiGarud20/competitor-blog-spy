export const TARGET_DELAY_SECONDS = 300; // 5 minutes

export function calculateDelaySeconds(publishedAt: Date | string, detectedAt: Date | string = new Date()): number {
  const pubDate = new Date(publishedAt).getTime();
  const detDate = new Date(detectedAt).getTime();

  if (isNaN(pubDate) || isNaN(detDate)) {
    return 0;
  }

  // Exact difference in seconds (never negative)
  return Math.max(0, Math.floor((detDate - pubDate) / 1000));
}

export function formatExactDelay(delaySeconds: number): string {
  if (isNaN(delaySeconds) || delaySeconds < 0) return '0s';

  const hours = Math.floor(delaySeconds / 3600);
  const minutes = Math.floor((delaySeconds % 3600) / 60);
  const seconds = delaySeconds % 60;

  if (hours > 0) {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${hours}h ${formattedMinutes}m ${formattedSeconds}s`;
  }

  if (minutes > 0) {
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}m ${formattedSeconds}s`;
  }

  return `${seconds}s`;
}

export function isDelayWithinTarget(delaySeconds: number, targetSeconds: number = TARGET_DELAY_SECONDS): boolean {
  return delaySeconds <= targetSeconds;
}

export function getDelayTargetBadge(delaySeconds: number, targetSeconds: number = TARGET_DELAY_SECONDS): {
  label: string;
  status: 'within' | 'above';
  color: string;
} {
  const within = isDelayWithinTarget(delaySeconds, targetSeconds);
  return {
    label: within ? 'Within Target' : 'Above Target',
    status: within ? 'within' : 'above',
    color: within ? '#10B981' : '#F59E0B'
  };
}
