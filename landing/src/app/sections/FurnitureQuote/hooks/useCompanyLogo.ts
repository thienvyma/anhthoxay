/**
 * useCompanyLogo Hook
 * Fetches logo from company settings for specific position
 * 
 * **Feature: logo-management**
 */

import { useState, useEffect } from 'react';
import { API_URL, resolveMediaUrl } from '@app/shared';

export type LogoPosition = 'header' | 'footer' | 'pdf' | 'quote' | 'favicon';

interface LogoItem {
  position: string;
  url: string;
}

export function useCompanyLogo(position: LogoPosition): string | null {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/settings/company`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || json;
        const settings = data.value || data;
        
        if (settings.logos && Array.isArray(settings.logos)) {
          const logo = settings.logos.find((l: LogoItem) => l.position === position);
          if (logo && logo.url) {
            setLogoUrl(resolveMediaUrl(logo.url));
          }
        }
      })
      .catch(() => {
        // Silently fail
      });
  }, [position]);

  return logoUrl;
}
