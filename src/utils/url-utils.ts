/**
 * URL utility functions for Quill
 */

/**
 * Normalize URL by removing trailing slashes and fragments
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash
    urlObj.pathname = urlObj.pathname.replace(/\/$/, '') || '/';
    // Remove fragment
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 */
export function getDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if two URLs are from the same domain
 */
export function isSameDomain(url1: string, url2: string): boolean {
  const domain1 = getDomain(url1);
  const domain2 = getDomain(url2);

  if (!domain1 || !domain2) return false;

  return domain1 === domain2;
}

/**
 * Convert relative URL to absolute URL
 */
export function toAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch {
    return relativeUrl;
  }
}

/**
 * Check if URL should be excluded from crawling
 */
export function shouldExcludeUrl(url: string): boolean {
  const excludePatterns = [
    /\.(pdf|zip|tar|gz|exe|dmg|pkg|deb|rpm)$/i, // Binary files
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i, // Images
    /\.(mp4|avi|mov|wmv|flv|webm)$/i, // Videos
    /\.(mp3|wav|ogg|flac)$/i, // Audio
    /\.(css|js|json|xml)$/i, // Assets
    /^mailto:/i, // Email links
    /^tel:/i, // Phone links
    /^javascript:/i, // JavaScript links
    /#.*$/i, // Fragment-only links (handled in normalize)
  ];

  return excludePatterns.some((pattern) => pattern.test(url));
}

/**
 * Extract domain-specific path from URL
 */
export function getPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return '';
  }
}

/**
 * Generate filename from URL
 */
export function urlToFilename(url: string, extension = 'png'): string {
  try {
    const urlObj = new URL(url);
    let filename = urlObj.hostname + urlObj.pathname;

    // Replace slashes and special characters
    filename = filename.replace(/[/\\?%*:|"<>]/g, '-');

    // Remove consecutive dashes
    filename = filename.replace(/-+/g, '-');

    // Remove leading/trailing dashes
    filename = filename.replace(/^-+|-+$/g, '');

    // Add extension
    return `${filename}.${extension}`;
  } catch {
    // Fallback to timestamp-based filename
    return `page-${Date.now()}.${extension}`;
  }
}

/**
 * Filter URLs to only include same-domain links
 */
export function filterSameDomainUrls(urls: string[], baseUrl: string): string[] {
  return urls.filter((url) => {
    if (!isValidUrl(url)) return false;
    if (shouldExcludeUrl(url)) return false;
    return isSameDomain(url, baseUrl);
  });
}
