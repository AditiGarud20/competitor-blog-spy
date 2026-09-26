import crypto from 'crypto';

export function generateContentHash(title: string, content: string): string {
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 5000);
  return crypto
    .createHash('sha256')
    .update(`${normalizedTitle}:::${normalizedContent}`)
    .digest('hex');
}
