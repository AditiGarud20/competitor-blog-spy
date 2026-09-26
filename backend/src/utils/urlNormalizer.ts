export function normalizeUrl(rawUrl: string, baseUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let trimmed = rawUrl.trim();

  // If relative URL, resolve against baseUrl
  if (baseUrl && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    try {
      trimmed = new URL(trimmed, baseUrl).toString();
    } catch {
      // Return as is if unable to parse
    }
  }

  try {
    const parsed = new URL(trimmed);

    // Normalize protocol and hostname to lowercase
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Strip common tracking and analytics query parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
      'mc_eid',
      '_ga',
      '_gl',
      'trk',
      'si',
      'feature'
    ];

    trackingParams.forEach((param) => {
      parsed.searchParams.delete(param);
    });

    // Remove empty search params or trailing ?
    let search = parsed.search;
    if (search === '?') search = '';

    // Normalize pathname - strip trailing slash unless root path '/'
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Strip hash fragment entirely
    return `${parsed.protocol}//${parsed.host}${pathname}${search}`;
  } catch {
    // If not a valid standard URL, return sanitized trimmed string
    return trimmed.replace(/\/+$/, '');
  }
}

export function isSameArticleUrl(url1: string, url2: string): boolean {
  return normalizeUrl(url1) === normalizeUrl(url2);
}
