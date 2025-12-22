import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Theme mode options
 * - light: Always use light theme
 * - dark: Always use dark theme  
 * - auto: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'portal-theme-mode';

/**
 * Get the system's preferred color scheme
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return true; // Default to dark
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get stored theme mode from localStorage
 */
function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored;
  }
  return 'dark'; // Default to dark mode
}

/**
 * Calculate if dark mode should be active based on mode setting
 */
function calculateIsDark(mode: ThemeMode): boolean {
  if (mode === 'auto') {
    return getSystemPreference();
  }
  return mode === 'dark';
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [isDark, setIsDark] = useState<boolean>(() => calculateIsDark(getStoredThemeMode()));
  const [isReady, setIsReady] = useState(false);

  // Apply theme class immediately on mount (before first render)
  useEffect(() => {
    const root = document.documentElement;
    const initialIsDark = calculateIsDark(getStoredThemeMode());
    root.classList.remove('light', 'dark');
    root.classList.add(initialIsDark ? 'dark' : 'light');
    setIsReady(true);
  }, []);

  // Update isDark when mode changes
  useEffect(() => {
    setIsDark(calculateIsDark(mode));
  }, [mode]);

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    if (mode !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(isDark ? 'dark' : 'light');
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0b0c0f' : '#ffffff');
    }
  }, [isDark]);

  // Set mode and persist to localStorage
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  const value: ThemeContextType = {
    mode,
    isDark,
    setMode,
  };

  // Show minimal loading state while theme is being applied
  // This prevents flash of unstyled content
  if (!isReady) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0b0c0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#f5d393',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Export storage key for testing
 */
export { THEME_STORAGE_KEY };
