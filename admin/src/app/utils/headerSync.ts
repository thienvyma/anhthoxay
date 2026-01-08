/**
 * Header Navigation Sync Utility
 *
 * Automatically syncs header navigation when pages are created/deleted
 * in the SectionsPage (Pages & Sections management).
 */

import { pagesApi } from '../api';
import type { HeaderNavItem } from '../pages/SettingsPage/types';

// Pages that should NOT be auto-added to navigation
const EXCLUDED_PAGES = ['home']; // Home is usually "/" not "/home"

// Default icon mapping for common page slugs
const PAGE_ICON_MAP: Record<string, string> = {
  about: 'ri-information-line',
  contact: 'ri-contacts-line',
  blog: 'ri-article-line',
  'bao-gia': 'ri-calculator-line',
  'noi-that': 'ri-home-smile-line',
  'chinh-sach': 'ri-shield-check-line',
  services: 'ri-service-line',
  portfolio: 'ri-gallery-line',
  faq: 'ri-question-line',
};

/**
 * Get icon for a page based on its slug
 */
function getPageIcon(slug: string): string {
  return PAGE_ICON_MAP[slug] || 'ri-pages-line';
}

/**
 * Convert page slug to route
 */
function slugToRoute(slug: string): string {
  if (slug === 'home') return '/';
  return `/${slug}`;
}

/**
 * Parse header config from page's headerConfig string
 */
function parseHeaderConfig(headerConfigStr: string | undefined): {
  navigation: HeaderNavItem[];
  raw: Record<string, unknown>;
} | null {
  if (!headerConfigStr || typeof headerConfigStr !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(headerConfigStr);
    const navigation: HeaderNavItem[] =
      parsed.links?.map(
        (link: { href: string; label: string; icon?: string; highlight?: boolean }) => ({
          label: link.label,
          route: link.href,
          icon: link.icon || '',
          highlight: link.highlight || false,
        })
      ) || [];

    return { navigation, raw: parsed };
  } catch {
    return null;
  }
}

/**
 * Serialize header config back to string for storage
 */
function serializeHeaderConfig(
  navigation: HeaderNavItem[],
  rawConfig: Record<string, unknown>
): string {
  const updatedConfig = {
    ...rawConfig,
    links: navigation.map((nav) => ({
      href: nav.route,
      label: nav.label,
      icon: nav.icon || undefined,
      highlight: nav.highlight || false,
    })),
  };

  return JSON.stringify(updatedConfig);
}

/**
 * Add a new page to header navigation
 *
 * @param pageSlug - The slug of the newly created page
 * @param pageTitle - The title of the page
 * @returns Promise<boolean> - true if sync was successful
 */
export async function addPageToHeaderNav(
  pageSlug: string,
  pageTitle: string
): Promise<boolean> {
  // Skip excluded pages
  if (EXCLUDED_PAGES.includes(pageSlug)) {
    return true;
  }

  try {
    // Get current header config from home page (source of truth)
    const homePage = await pagesApi.get('home');
    const headerData = parseHeaderConfig(homePage?.headerConfig as string | undefined);

    if (!headerData) {
      console.warn('[HeaderSync] No header config found on home page');
      return false;
    }

    // Check if page already exists in navigation
    const route = slugToRoute(pageSlug);
    const exists = headerData.navigation.some((nav) => nav.route === route);

    if (exists) {
      console.warn(`[HeaderSync] Page "${pageSlug}" already in navigation`);
      return true;
    }

    // Add new navigation item
    const newNavItem: HeaderNavItem = {
      label: pageTitle,
      route: route,
      icon: getPageIcon(pageSlug),
      highlight: false,
    };

    headerData.navigation.push(newNavItem);

    // Serialize and save to all pages
    const headerConfigStr = serializeHeaderConfig(headerData.navigation, headerData.raw);

    // Get all pages and update their headerConfig
    const allPages = await pagesApi.list();
    await Promise.all(
      allPages.map((page) => pagesApi.update(page.slug, { headerConfig: headerConfigStr }))
    );

    console.warn(`[HeaderSync] Added "${pageTitle}" to header navigation`);
    return true;
  } catch (error) {
    console.error('[HeaderSync] Failed to add page to navigation:', error);
    return false;
  }
}

/**
 * Remove a page from header navigation
 *
 * @param pageSlug - The slug of the deleted page
 * @returns Promise<boolean> - true if sync was successful
 */
export async function removePageFromHeaderNav(pageSlug: string): Promise<boolean> {
  try {
    // Get current header config from home page (source of truth)
    const homePage = await pagesApi.get('home');
    const headerData = parseHeaderConfig(homePage?.headerConfig as string | undefined);

    if (!headerData) {
      console.warn('[HeaderSync] No header config found on home page');
      return false;
    }

    // Find and remove the navigation item
    const route = slugToRoute(pageSlug);
    const initialLength = headerData.navigation.length;
    headerData.navigation = headerData.navigation.filter((nav) => nav.route !== route);

    if (headerData.navigation.length === initialLength) {
      console.warn(`[HeaderSync] Page "${pageSlug}" not found in navigation`);
      return true;
    }

    // Serialize and save to all pages
    const headerConfigStr = serializeHeaderConfig(headerData.navigation, headerData.raw);

    // Get all pages and update their headerConfig
    const allPages = await pagesApi.list();
    await Promise.all(
      allPages.map((page) => pagesApi.update(page.slug, { headerConfig: headerConfigStr }))
    );

    console.warn(`[HeaderSync] Removed "${pageSlug}" from header navigation`);
    return true;
  } catch (error) {
    console.error('[HeaderSync] Failed to remove page from navigation:', error);
    return false;
  }
}
