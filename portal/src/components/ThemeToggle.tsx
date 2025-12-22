import { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';

interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: string;
}

const themeOptions: ThemeOption[] = [
  { mode: 'light', label: 'Sáng', icon: 'ri-sun-line' },
  { mode: 'dark', label: 'Tối', icon: 'ri-moon-line' },
  { mode: 'auto', label: 'Tự động', icon: 'ri-computer-line' },
];

/**
 * Theme toggle component with dropdown menu
 * Requirements: 25.1 - Dark mode toggle
 */
export function ThemeToggle() {
  const { mode, isDark, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current theme icon
  const currentIcon = mode === 'auto' 
    ? 'ri-computer-line' 
    : isDark 
      ? 'ri-moon-line' 
      : 'ri-sun-line';

  const handleModeChange = (newMode: ThemeMode) => {
    // Add transition class for smooth animation
    document.documentElement.classList.add('theme-transition');
    
    setMode(newMode);
    setIsOpen(false);
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  return (
    <div className="theme-toggle-wrapper" ref={dropdownRef}>
      <button
        className="header-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chuyển đổi giao diện"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className={currentIcon} style={{ fontSize: '20px' }} />
      </button>

      {isOpen && (
        <div className="dropdown-menu theme-dropdown">
          <div className="dropdown-header">
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Giao diện
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {themeOptions.map((option) => (
              <button
                key={option.mode}
                className={`dropdown-item ${mode === option.mode ? 'active' : ''}`}
                onClick={() => handleModeChange(option.mode)}
                style={{
                  background: mode === option.mode ? 'var(--primary-muted)' : 'transparent',
                  color: mode === option.mode ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                <i className={option.icon} style={{ fontSize: '18px' }} />
                <span>{option.label}</span>
                {mode === option.mode && (
                  <i 
                    className="ri-check-line" 
                    style={{ marginLeft: 'auto', fontSize: '16px' }} 
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
