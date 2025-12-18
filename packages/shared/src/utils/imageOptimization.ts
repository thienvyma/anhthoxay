/**
 * Image Optimization Utilities
 * 
 * Provides comprehensive image handling for ANH THỢ XÂY platform:
 * - Responsive image URLs with srcset
 * - Modern format conversion (WebP/AVIF)
 * - Lazy loading support
 * - CDN integration
 * - Performance optimization
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  lazy?: boolean;
  sizes?: string; // Responsive sizes attribute
}

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  sizes?: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  className?: string;
}

/**
 * Check if URL is from Unsplash
 */
function isUnsplashUrl(url: string): boolean {
  return url.includes('unsplash.com') || url.includes('images.unsplash.com');
}

/**
 * Optimize Unsplash image URL
 * Unsplash provides built-in optimization via URL parameters
 */
function optimizeUnsplashUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  const { width, height, quality = 80, format = 'auto', fit = 'crop' } = options;
  
  // Clean URL and add parameters
  const baseUrl = url.split('?')[0];
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('fit', fit);
  
  // Format conversion
  if (format === 'webp') params.set('fm', 'webp');
  else if (format === 'avif') params.set('fm', 'avif');
  else if (format === 'jpg') params.set('fm', 'jpg');
  else if (format === 'auto') params.set('auto', 'format');
  
  // Enable compression
  params.set('auto', 'compress');
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate responsive srcset for Unsplash images
 */
function generateUnsplashSrcSet(url: string, options: ImageOptimizationOptions = {}): string {
  const widths = [320, 640, 768, 1024, 1280, 1536, 1920];
  const { quality = 80, format = 'auto' } = options;
  
  return widths
    .map(w => {
      const optimizedUrl = optimizeUnsplashUrl(url, { width: w, quality, format });
      return `${optimizedUrl} ${w}w`;
    })
    .join(', ');
}

/**
 * Get optimized image URL
 * Works with Unsplash and can be extended for other CDNs
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';
  
  // Handle Unsplash URLs
  if (isUnsplashUrl(url)) {
    return optimizeUnsplashUrl(url, options);
  }
  
  // For local/uploaded images starting with /media/, prepend API base URL
  if (url.startsWith('/media/')) {
    // Import getApiUrl from config to get environment-based URL
    // Using dynamic import to avoid circular dependency
    const { getApiUrl } = require('../config');
    return `${getApiUrl()}${url}`;
  }
  
  // For URLs that already have protocol, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For local/uploaded images, return as-is (can be extended with CDN integration)
  return url;
}

/**
 * Generate responsive image props for <img> tag
 * Use this for optimal performance across devices
 */
export function getResponsiveImageProps(
  url: string,
  alt: string,
  options: ImageOptimizationOptions = {}
): ResponsiveImageSet {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    lazy = true,
    sizes,
  } = options;
  
  // Default responsive sizes
  const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  
  // Generate optimized src
  const src = getOptimizedImageUrl(url, { width, height, quality, format });
  
  // Generate srcSet for responsive images
  let srcSet = '';
  if (isUnsplashUrl(url)) {
    srcSet = generateUnsplashSrcSet(url, { quality, format });
  } else {
    // For non-Unsplash, use single src
    srcSet = src;
  }
  
  return {
    src,
    srcSet,
    sizes: defaultSizes,
    alt,
    width,
    height,
    loading: lazy ? 'lazy' : 'eager',
  };
}

/**
 * Get thumbnail URL (small, optimized version)
 */
export function getThumbnailUrl(url: string, size = 200): string {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    quality: 75,
    format: 'webp',
    fit: 'cover',
  });
}

/**
 * Get hero/banner image URL (large, high quality)
 */
export function getHeroImageUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 1920,
    quality: 85,
    format: 'webp',
    fit: 'cover',
  });
}

/**
 * Get card image URL (medium size)
 */
export function getCardImageUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 800,
    height: 600,
    quality: 80,
    format: 'webp',
    fit: 'cover',
  });
}

/**
 * Create placeholder/blur data URL for progressive loading
 */
export function getPlaceholderDataUrl(color = '#1a1b23'): string {
  // Generate a tiny 1x1 SVG as placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
      <rect width="1" height="1" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get blur-up placeholder (LQIP - Low Quality Image Placeholder)
 */
export function getLQIPUrl(url: string): string {
  return getOptimizedImageUrl(url, {
    width: 20,
    quality: 10,
    format: 'webp',
  });
}

/**
 * Export all utilities as default
 */
export default {
  getOptimizedImageUrl,
  getResponsiveImageProps,
  getThumbnailUrl,
  getHeroImageUrl,
  getCardImageUrl,
  getPlaceholderDataUrl,
  getLQIPUrl,
};

