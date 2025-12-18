import { resolveMediaUrl } from '@app/shared';

/**
 * Convert relative media URLs to absolute URLs
 * @param url - Image URL (can be relative /media/xxx or absolute http://...)
 * @returns Absolute URL ready for use in src/background-image
 */
export function toAbsoluteUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return resolveMediaUrl(url) || undefined;
}

/**
 * Fix image URL in section data object
 * Recursively processes objects and arrays to convert all image URLs
 */
export function fixSectionImageUrls<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => fixSectionImageUrls(item)) as T;
  }
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Convert known image URL fields
    if ((key === 'imageUrl' || key === 'url' || key === 'backgroundUrl') && typeof value === 'string') {
      result[key] = toAbsoluteUrl(value);
    }
    // Recursively process nested objects/arrays
    else if (value && typeof value === 'object') {
      result[key] = fixSectionImageUrls(value);
    }
    // Keep other values as-is
    else {
      result[key] = value;
    }
  }
  
  return result as T;
}

