import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

// Glass Morphism Design Tokens (matching landing page)
const glass = {
  background: 'rgba(12,12,16,0.7)',
  border: '1px solid rgba(255,255,255,0.08)',
  blur: 'blur(20px)',
  shadow: '0 8px 32px rgba(0,0,0,0.3)',
  hoverBorder: '1px solid rgba(245,211,147,0.3)',
  hoverShadow: '0 12px 48px rgba(245,211,147,0.15)',
};

interface RestaurantSettings {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  openingHours: string;
  backgroundImage?: string;
}

interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  newReservations: boolean;
  newComments: boolean;
  systemUpdates: boolean;
}

interface HeaderConfig {
  logo?: { text?: string; icon?: string; imageUrl?: string; animateIcon?: boolean };
  navigation?: Array<{ label: string; route: string; icon?: string }>;
  cta?: { text?: string; link?: string; variant?: 'primary' | 'outline' };
  options?: { sticky?: boolean; transparent?: boolean; showSearch?: boolean };
}

interface FooterConfig {
  brand?: { text?: string; icon?: string; tagline?: string };
  quickLinks?: Array<{ label: string; link: string; }>;
  newsletter?: { title?: string; placeholder?: string; buttonText?: string };
  social?: Array<{ platform: string; url: string; icon: string }>;
  copyright?: { text?: string };
}

// Add loading animation CSS
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .ri-loader-4-line {
    animation: spin 1s linear infinite;
  }
`;
if (!document.querySelector('style[data-settings-animations]')) {
  loadingStyle.setAttribute('data-settings-animations', 'true');
  document.head.appendChild(loadingStyle);
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'layout' | 'restaurant' | 'theme' | 'notifications'>('layout');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings>({
    name: 'The Divine Cuisine',
    description: 'Fine dining experience with AI-powered service',
    address: '123 Gourmet Street, Food City',
    phone: '+84 123 456 789',
    email: 'contact@thedivine.com',
    website: 'https://thedivine.com',
    openingHours: '10:00 - 22:00',
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: '#f5d393',
    accentColor: '#3b82f6',
    fontFamily: 'Inter',
  });

  // Fetch restaurant settings from API on mount
  useEffect(() => {
    const fetchRestaurantSettings = async () => {
      try {
        const response = await fetch('http://localhost:4202/settings/restaurant', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.value) {
            setRestaurantSettings(prev => ({ ...prev, ...data.value }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant settings:', error);
      }
    };

    const fetchThemeSettings = async () => {
      try {
        const response = await fetch('http://localhost:4202/settings/theme', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.value) {
            setThemeSettings(prev => ({ ...prev, ...data.value }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme settings:', error);
      }
    };

    fetchRestaurantSettings();
    fetchThemeSettings();
  }, []);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    newReservations: true,
    newComments: true,
    systemUpdates: false,
  });

  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>({
    logo: { text: 'Restaurant', icon: 'ri-restaurant-2-line', animateIcon: true },
    navigation: [
      { label: 'Home', route: 'home', icon: 'ri-home-4-line' },
      { label: 'Menu', route: 'menu', icon: 'ri-restaurant-line' },
      { label: 'About', route: 'about', icon: 'ri-information-line' },
      { label: 'Gallery', route: 'gallery', icon: 'ri-image-line' },
      { label: 'Blog', route: 'blog', icon: 'ri-article-line' },
      { label: 'Contact', route: 'contact', icon: 'ri-map-pin-line' },
    ],
    cta: { text: 'Đặt bàn ngay', link: 'tel:+84123456789', variant: 'primary' },
    options: { sticky: true, transparent: false, showSearch: false },
  });

  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    brand: { text: 'Restaurant', icon: 'ri-restaurant-2-fill', tagline: 'Fine dining experience' },
    quickLinks: [
      { label: 'About Us', link: '/about' },
      { label: 'Menu', link: '/menu' },
      { label: 'Reservations', link: '/contact' },
      { label: 'Gallery', link: '/gallery' },
    ],
    newsletter: { 
      title: 'Subscribe to our newsletter', 
      placeholder: 'Enter your email',
      buttonText: 'Subscribe'
    },
    social: [
      { platform: 'Facebook', url: 'https://facebook.com', icon: 'ri-facebook-fill' },
      { platform: 'Instagram', url: 'https://instagram.com', icon: 'ri-instagram-fill' },
      { platform: 'Twitter', url: 'https://twitter.com', icon: 'ri-twitter-x-fill' },
    ],
    copyright: { text: `© ${new Date().getFullYear()} Restaurant. All rights reserved.` },
  });

  const handleSaveRestaurant = async () => {
    try {
      setSaving(true);
      const response = await fetch('http://localhost:4202/settings/restaurant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: restaurantSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save restaurant settings');
      }

      // Also save to localStorage as backup
    localStorage.setItem('restaurantSettings', JSON.stringify(restaurantSettings));
      showSavedMessage('✅ Restaurant information saved successfully!');
    } catch (error) {
      console.error('Error saving restaurant settings:', error);
      alert('Failed to save restaurant settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async () => {
    try {
      setSaving(true);
      const response = await fetch('http://localhost:4202/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ value: themeSettings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme settings');
      }

      // Apply theme CSS variables
    document.documentElement.style.setProperty('--primary-color', themeSettings.primaryColor);
    document.documentElement.style.setProperty('--accent-color', themeSettings.accentColor);
    document.documentElement.style.setProperty('--font-family', themeSettings.fontFamily);
      
      // Save to localStorage as backup
      localStorage.setItem('themeSettings', JSON.stringify(themeSettings));
      showSavedMessage('✅ Theme settings saved successfully!');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      alert('Failed to save theme settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    showSavedMessage();
  };

  const handleSaveHeader = async (customHeaderConfig?: typeof headerConfig) => {
    try {
      // Use custom config if provided (for logo upload), otherwise use current state
      const configToSave = customHeaderConfig || headerConfig;
      
      // Transform admin format to landing format
      const landingHeaderConfig = {
        logo: configToSave.logo,
        links: configToSave.navigation?.map(nav => ({
          href: nav.route?.startsWith('/') ? nav.route : `/${nav.route}`,
          label: nav.label,
          icon: nav.icon,
        })) || [],
        ctaButton: configToSave.cta ? {
          text: configToSave.cta.text,
          href: configToSave.cta.link,
          icon: 'ri-phone-line',
        } : undefined,
        showMobileMenu: true,
      };
      
      // Save to all pages via API
      const pages = ['home', 'menu', 'gallery', 'about', 'contact'];
      const headerConfigStr = JSON.stringify(landingHeaderConfig);
      
      console.log('🔧 [HEADER SAVE] Transformed config:', landingHeaderConfig);
      console.log('🔧 [HEADER SAVE] JSON string length:', headerConfigStr.length);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const slug of pages) {
        try {
          console.log(`📤 [HEADER SAVE] Sending PUT to /pages/${slug}...`);
          
          const response = await fetch(`http://localhost:4202/pages/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Send auth cookies
            body: JSON.stringify({ headerConfig: headerConfigStr }),
          });
          
          console.log(`📥 [HEADER SAVE] Response for ${slug}:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to update ${slug}:`, response.status, errorText);
            failCount++;
          } else {
            const data = await response.json();
            console.log(`✅ Updated header for ${slug}:`, data);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Network error for ${slug}:`, err);
          failCount++;
        }
      }
      
      console.log(`🎯 [HEADER SAVE] Result: ${successCount} success, ${failCount} failed`);
      
      // Don't save to localStorage - DB is source of truth now
      
      if (successCount > 0) {
        showSavedMessage(`✅ Header saved to ${successCount} page${successCount > 1 ? 's' : ''}!`);
      } else {
        showSavedMessage(`❌ Failed to save header. Check console for details.`);
      }
    } catch (error) {
      console.error('💥 [HEADER SAVE] Fatal error:', error);
      alert('Failed to save header configuration');
    }
  };

  const handleSaveFooter = async () => {
    try {
      // Transform admin format to landing format
      // Sync logo from header config to footer for consistency
      const landingFooterConfig = {
        brand: {
          text: footerConfig.brand?.text || headerConfig.logo?.text,
          icon: footerConfig.brand?.icon || headerConfig.logo?.icon,
          imageUrl: headerConfig.logo?.imageUrl, // Sync logo image from header
          description: footerConfig.brand?.tagline,
          awards: ['🏆', '⭐', '🎖️'], // Default awards
        },
        quickLinks: footerConfig.quickLinks?.map(link => ({
          label: link.label,
          href: link.link,
        })) || [],
        newsletter: footerConfig.newsletter ? {
          enabled: true,
          title: footerConfig.newsletter.title,
          description: 'Đăng ký để nhận thông tin khuyến mãi mới nhất',
          placeholder: footerConfig.newsletter.placeholder,
        } : undefined,
        socialLinks: footerConfig.social?.map(s => ({
          platform: s.platform.toLowerCase(),
          url: s.url,
          icon: s.icon,
        })) || [],
        copyright: footerConfig.copyright,
      };
      
      // Save to all pages via API
      const pages = ['home', 'menu', 'gallery', 'about', 'contact'];
      const footerConfigStr = JSON.stringify(landingFooterConfig);
      
      console.log('🔧 [FOOTER SAVE] Transformed config:', landingFooterConfig);
      console.log('🔧 [FOOTER SAVE] JSON string length:', footerConfigStr.length);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const slug of pages) {
        try {
          console.log(`📤 [FOOTER SAVE] Sending PUT to /pages/${slug}...`);
          
          const response = await fetch(`http://localhost:4202/pages/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Send auth cookies
            body: JSON.stringify({ footerConfig: footerConfigStr }),
          });
          
          console.log(`📥 [FOOTER SAVE] Response for ${slug}:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to update ${slug}:`, response.status, errorText);
            failCount++;
          } else {
            const data = await response.json();
            console.log(`✅ Updated footer for ${slug}:`, data);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Network error for ${slug}:`, err);
          failCount++;
        }
      }
      
      console.log(`🎯 [FOOTER SAVE] Result: ${successCount} success, ${failCount} failed`);
      
      // Don't save to localStorage - DB is source of truth now
      
      if (successCount > 0) {
        showSavedMessage(`✅ Footer saved to ${successCount} page${successCount > 1 ? 's' : ''}!`);
      } else {
        showSavedMessage(`❌ Failed to save footer. Check console for details.`);
      }
    } catch (error) {
      console.error('Failed to save footer config:', error);
      alert('Failed to save footer configuration');
    }
  };

  const showSavedMessage = (message: string = 'Settings saved successfully!') => {
    setSaveSuccess(message);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSaveSuccess(null);
    }, 4000);
  };

  // Drag and drop handlers for navigation links
  const handleNavDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleNavDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleNavDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newNav = [...(headerConfig.navigation || [])];
    const [removed] = newNav.splice(dragIndex, 1);
    newNav.splice(dropIndex, 0, removed);
    
    setHeaderConfig({ ...headerConfig, navigation: newNav });
  }, [headerConfig]);

  // Drag and drop handlers for footer quick links
  const handleQuickLinkDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleQuickLinkDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleQuickLinkDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newLinks = [...(footerConfig.quickLinks || [])];
    const [removed] = newLinks.splice(dragIndex, 1);
    newLinks.splice(dropIndex, 0, removed);
    
    setFooterConfig({ ...footerConfig, quickLinks: newLinks });
  }, [footerConfig]);

  // Drag and drop handlers for social media links
  const handleSocialDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleSocialDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleSocialDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newSocial = [...(footerConfig.social || [])];
    const [removed] = newSocial.splice(dragIndex, 1);
    newSocial.splice(dropIndex, 0, removed);
    
    setFooterConfig({ ...footerConfig, social: newSocial });
  }, [footerConfig]);

  useEffect(() => {
    // Load restaurant/theme/notifications from localStorage (not in DB)
    const savedRestaurant = localStorage.getItem('restaurantSettings');
    const savedTheme = localStorage.getItem('themeSettings');
    const savedNotifications = localStorage.getItem('notificationSettings');

    if (savedRestaurant) setRestaurantSettings(JSON.parse(savedRestaurant));
    if (savedTheme) setThemeSettings(JSON.parse(savedTheme));
    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications));
    
    // Load header/footer config from DATABASE (home page as source of truth)
    async function loadHeaderFooterFromDB() {
      try {
        const response = await fetch('http://localhost:4202/pages/home', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          console.warn('Failed to load header/footer from DB, using defaults');
          return;
        }
        
        const pageData = await response.json();
        
        // Parse headerConfig from DB and transform to Admin format
        if (pageData.headerConfig) {
          const dbHeader = typeof pageData.headerConfig === 'string' 
            ? JSON.parse(pageData.headerConfig) 
            : pageData.headerConfig;
          
          // Transform Landing format → Admin format
          const adminHeader = {
            logo: dbHeader.logo || { text: 'Restaurant', icon: 'ri-restaurant-2-line', animateIcon: true },
            navigation: dbHeader.links?.map((link: any) => ({
              label: link.label,
              route: link.href?.replace('#/', '') || link.href, // Remove #/ prefix
              icon: link.icon,
            })) || [],
            cta: dbHeader.ctaButton ? {
              text: dbHeader.ctaButton.text,
              link: dbHeader.ctaButton.href,
              variant: 'primary',
            } : undefined,
            options: { sticky: true, transparent: false, showSearch: false },
          };
          
          setHeaderConfig(adminHeader as any);
          console.log('✅ Loaded header config from DB:', adminHeader);
        }
        
        // Parse footerConfig from DB and transform to Admin format
        if (pageData.footerConfig) {
          const dbFooter = typeof pageData.footerConfig === 'string' 
            ? JSON.parse(pageData.footerConfig) 
            : pageData.footerConfig;
          
          // Transform Landing format → Admin format
          const adminFooter = {
            brand: {
              text: dbFooter.brand?.text || 'Restaurant',
              icon: dbFooter.brand?.icon || 'ri-restaurant-2-fill',
              tagline: dbFooter.brand?.description || '',
            },
            quickLinks: dbFooter.quickLinks?.map((link: any) => ({
              label: link.label,
              link: link.href, // Landing uses 'href', Admin uses 'link'
            })) || [],
            newsletter: dbFooter.newsletter?.enabled ? {
              title: dbFooter.newsletter.title || 'Subscribe',
              placeholder: dbFooter.newsletter.placeholder || 'Email',
              buttonText: 'Subscribe',
            } : undefined,
            social: dbFooter.socialLinks?.map((s: any) => ({
              platform: s.platform.charAt(0).toUpperCase() + s.platform.slice(1), // Capitalize
              url: s.url,
              icon: s.icon,
            })) || [],
            copyright: dbFooter.copyright || { text: `© ${new Date().getFullYear()} Restaurant` },
          };
          
          setFooterConfig(adminFooter as any);
          console.log('✅ Loaded footer config from DB:', adminFooter);
        }
      } catch (error) {
        console.error('Failed to load header/footer from DB:', error);
      }
    }
    
    loadHeaderFooterFromDB();
  }, []);

  const tabs = [
    { id: 'layout' as const, label: 'Layout', icon: 'ri-layout-line' },
    { id: 'restaurant' as const, label: 'Restaurant Info', icon: 'ri-building-2-line' },
    { id: 'theme' as const, label: 'Theme', icon: 'ri-palette-line' },
    { id: 'notifications' as const, label: 'Notifications', icon: 'ri-notification-3-line' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
      {/* Modern Header với Glass Effect */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          marginBottom: 32,
          background: glass.background,
          backdropFilter: glass.blur,
          border: glass.border,
          borderRadius: '24px',
          padding: '32px',
          boxShadow: glass.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#0b0c0f',
              boxShadow: '0 8px 24px rgba(245,211,147,0.3)',
            }}
          >
            <i className="ri-settings-3-line" />
          </motion.div>
          <div>
            <h1 style={{ 
              fontSize: 36, 
              fontWeight: 700, 
              color: tokens.color.text, 
              margin: 0,
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Settings
            </h1>
            <p style={{ 
              color: tokens.color.muted, 
              fontSize: 15, 
              margin: '4px 0 0 0',
              fontWeight: 400,
            }}>
              Quản lý cài đặt hệ thống và nhà hàng
            </p>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Success/Error Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -30 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.85, y: -30 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400,
              damping: 25,
            }}
            style={{
              marginBottom: 24,
              background: saveSuccess?.includes('❌') 
                ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))' 
                : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
              backdropFilter: glass.blur,
              border: saveSuccess?.includes('❌')
                ? '2px solid rgba(239,68,68,0.4)'
                : '2px solid rgba(16,185,129,0.4)',
              borderRadius: '20px',
              padding: '20px 28px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              boxShadow: saveSuccess?.includes('❌')
                ? '0 12px 40px rgba(239,68,68,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 12px 40px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Animated Background Pulse */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: 20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: saveSuccess?.includes('❌')
                  ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />

            {/* Icon with animations */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                delay: 0.1,
              }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <motion.div
                animate={{ 
                  rotate: saveSuccess?.includes('❌') ? 0 : [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 0.5, delay: 0.2 },
                  scale: { duration: 0.3, delay: 0.15 },
                }}
              >
                <i 
                  className={saveSuccess?.includes('❌') 
                    ? 'ri-error-warning-fill' 
                    : 'ri-checkbox-circle-fill'
                  } 
                  style={{ 
                    fontSize: 32, 
                    color: saveSuccess?.includes('❌') ? '#ef4444' : '#10b981',
                    filter: 'drop-shadow(0 2px 8px currentColor)',
                  }} 
                />
            </motion.div>
            </motion.div>

            {/* Message */}
            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
            <span style={{ 
                  fontWeight: 700, 
                  color: saveSuccess?.includes('❌') ? '#fca5a5' : '#6ee7b7',
                  fontSize: 16,
                  display: 'block',
                  lineHeight: 1.4,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}>
                  {saveSuccess || 'Settings saved successfully!'}
            </span>
              </motion.div>
            </div>

            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSaved(false);
                setSaveSuccess(null);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: saveSuccess?.includes('❌') ? '#fca5a5' : '#6ee7b7',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <i className="ri-close-line" style={{ fontSize: 18 }} />
            </motion.button>

            {/* Shimmer effect */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 1,
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Tabs với Glass */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 32,
        background: glass.background,
        backdropFilter: glass.blur,
        border: glass.border,
        borderRadius: '20px',
        padding: '12px',
        boxShadow: glass.shadow,
      }}>
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '16px 24px',
              background: activeTab === tab.id 
                ? `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})` 
                : 'transparent',
              color: activeTab === tab.id ? '#0b0c0f' : tokens.color.muted,
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '14px',
              boxShadow: activeTab === tab.id ? '0 4px 16px rgba(245,211,147,0.3)' : 'none',
            }}
          >
            <i className={tab.icon} style={{ fontSize: 20 }} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Layout Settings - Header & Footer */}
      {activeTab === 'layout' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header Config */}
            <Card icon="ri-layout-top-2-line" title="Header Configuration" subtitle="Tùy chỉnh logo, menu navigation và CTA button">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Logo Section */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(59,130,246,0.05))',
                    borderRadius: '12px',
                    border: '1px solid rgba(245,211,147,0.2)',
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(59,130,246,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(245,211,147,0.3)',
                    }}>
                      <i className="ri-image-line" style={{ fontSize: 20, color: tokens.color.primary }} />
                    </div>
                    <div>
                      <h3 style={{ color: tokens.color.text, fontSize: 17, fontWeight: 700, margin: 0 }}>
                        Logo & Brand
                      </h3>
                      <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0 0' }}>
                        Upload your brand logo or use text with icon
                      </p>
                    </div>
                  </div>

                  {/* Logo Image Info - Upload moved to Restaurant Information tab */}
                  {headerConfig.logo?.imageUrl && (
                    <div style={{ 
                      marginBottom: 24, 
                      padding: 16,
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                      borderRadius: 12,
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}>
                      <div style={{
                        padding: 12,
                        background: 'white',
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img 
                          src={`http://localhost:4202${headerConfig.logo.imageUrl}`}
                          alt="Current logo"
                          style={{ 
                            maxHeight: 50,
                            maxWidth: 150,
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ 
                          color: '#10b981', 
                          fontSize: 14, 
                          fontWeight: 600, 
                          marginBottom: 4,
                        }}>
                          ✅ Logo Active
                        </p>
                        <p style={{ 
                          color: tokens.color.muted, 
                          fontSize: 12, 
                          margin: 0,
                        }}>
                          <i className="ri-information-line" style={{ marginRight: 4 }} />
                          To change logo, go to <strong>Restaurant Info</strong> tab
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Text & Icon Fallback */}
                  <div style={{ 
                    marginBottom: 16,
                    padding: 16,
                    background: 'rgba(59,130,246,0.05)',
                    borderRadius: 12,
                    border: '1px solid rgba(59,130,246,0.15)',
                  }}>
                    <p style={{ 
                      color: tokens.color.text, 
                      fontSize: 13, 
                      marginBottom: 12,
                      fontWeight: 600,
                    }}>
                      Or use text with icon (fallback when no image)
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <Input
                        label="Logo Text"
                        value={headerConfig.logo?.text || ''}
                        onChange={(value) => setHeaderConfig({ ...headerConfig, logo: { ...headerConfig.logo, text: value } })}
                        placeholder="Restaurant Name"
                        fullWidth
                      />
                      <Input
                        label="Logo Icon (RemixIcon class)"
                        value={headerConfig.logo?.icon || ''}
                        onChange={(value) => setHeaderConfig({ ...headerConfig, logo: { ...headerConfig.logo, icon: value } })}
                        placeholder="ri-restaurant-2-line"
                        fullWidth
                      />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={headerConfig.logo?.animateIcon || false}
                          onChange={(e) => setHeaderConfig({ ...headerConfig, logo: { ...headerConfig.logo, animateIcon: e.target.checked } })}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ color: tokens.color.text, fontSize: 14 }}>Animate icon on hover</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      flex: 1,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(59,130,246,0.05))',
                      borderRadius: '12px',
                      border: '1px solid rgba(245,211,147,0.2)',
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(59,130,246,0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(245,211,147,0.3)',
                      }}>
                        <i className="ri-menu-line" style={{ fontSize: 20, color: tokens.color.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: tokens.color.text, fontSize: 17, fontWeight: 700, margin: 0 }}>
                          Navigation Links
                        </h3>
                        <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0 0' }}>
                          <i className="ri-drag-move-2-line" style={{ marginRight: 4 }} />
                          Drag to reorder • {headerConfig.navigation?.length || 0} links
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const newNav = [...(headerConfig.navigation || []), { label: 'New Link', route: '', icon: '' }];
                        setHeaderConfig({ ...headerConfig, navigation: newNav });
                      }}
                      icon="ri-add-line"
                      size="sm"
                    >
                      Add Link
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {headerConfig.navigation?.map((link, index) => (
                      <motion.div 
                        key={index} 
                        draggable
                        onDragStart={(e) => handleNavDragStart(e, index)}
                        onDragOver={handleNavDragOver}
                        onDrop={(e) => handleNavDrop(e, index)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ 
                          scale: 1.01,
                          y: -3,
                        }}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'auto 1fr 1fr 1fr auto', 
                          gap: 12,
                          padding: 18,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                          borderRadius: '14px',
                          border: `2px solid ${tokens.color.border}`,
                          cursor: 'grab',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,211,147,0.15), rgba(59,130,246,0.08))';
                          e.currentTarget.style.borderColor = 'rgba(245,211,147,0.5)';
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,211,147,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))';
                          e.currentTarget.style.borderColor = tokens.color.border;
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                        onDragEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,211,147,0.25), rgba(59,130,246,0.15))';
                          e.currentTarget.style.borderColor = tokens.color.primary;
                          e.currentTarget.style.borderStyle = 'dashed';
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))';
                          e.currentTarget.style.borderColor = tokens.color.border;
                          e.currentTarget.style.borderStyle = 'solid';
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: tokens.color.muted,
                          fontSize: 18,
                          cursor: 'grab',
                        }}>
                          <i className="ri-drag-move-2-fill" />
                        </div>
                        <Input
                          label="Label"
                          value={link.label}
                          onChange={(value) => {
                            const newNav = [...(headerConfig.navigation || [])];
                            newNav[index] = { ...newNav[index], label: value };
                            setHeaderConfig({ ...headerConfig, navigation: newNav });
                          }}
                          placeholder="Home"
                          fullWidth
                        />
                        <Input
                          label="Route"
                          value={link.route}
                          onChange={(value) => {
                            const newNav = [...(headerConfig.navigation || [])];
                            newNav[index] = { ...newNav[index], route: value };
                            setHeaderConfig({ ...headerConfig, navigation: newNav });
                          }}
                          placeholder="home"
                          fullWidth
                        />
                        <Input
                          label="Icon (optional)"
                          value={link.icon || ''}
                          onChange={(value) => {
                            const newNav = [...(headerConfig.navigation || [])];
                            newNav[index] = { ...newNav[index], icon: value };
                            setHeaderConfig({ ...headerConfig, navigation: newNav });
                          }}
                          placeholder="ri-home-line"
                          fullWidth
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const newNav = headerConfig.navigation?.filter((_, i) => i !== index);
                            setHeaderConfig({ ...headerConfig, navigation: newNav });
                          }}
                          style={{
                            alignSelf: 'flex-end',
                            width: 36,
                            height: 36,
                            borderRadius: tokens.radius.sm,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <i className="ri-delete-bin-line" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 20,
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(59,130,246,0.05))',
                    borderRadius: '12px',
                    border: '1px solid rgba(245,211,147,0.2)',
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(59,130,246,0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(245,211,147,0.3)',
                    }}>
                      <i className="ri-cursor-fill" style={{ fontSize: 20, color: tokens.color.primary }} />
                    </div>
                    <div>
                      <h3 style={{ color: tokens.color.text, fontSize: 17, fontWeight: 700, margin: 0 }}>
                        Call-to-Action Button
                      </h3>
                      <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0 0' }}>
                        Primary action in header
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <Input
                      label="Button Text"
                      value={headerConfig.cta?.text || ''}
                      onChange={(value) => setHeaderConfig({ ...headerConfig, cta: { ...headerConfig.cta, text: value } })}
                      placeholder="Book Now"
                      fullWidth
                    />
                    <Input
                      label="Button Link"
                      value={headerConfig.cta?.link || ''}
                      onChange={(value) => setHeaderConfig({ ...headerConfig, cta: { ...headerConfig.cta, link: value } })}
                      placeholder="/contact"
                      fullWidth
                    />
                    <div>
                      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                        Button Style
                      </label>
                      <select
                        value={headerConfig.cta?.variant || 'primary'}
                        onChange={(e) => setHeaderConfig({ ...headerConfig, cta: { ...headerConfig.cta, variant: e.target.value as 'primary' | 'outline' } })}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${tokens.color.border}`,
                          borderRadius: tokens.radius.md,
                          color: tokens.color.text,
                          fontSize: 14,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="primary">Primary (Filled)</option>
                        <option value="outline">Outline</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div>
                  <h3 style={{ color: tokens.color.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Display Options
                  </h3>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={headerConfig.options?.sticky || false}
                        onChange={(e) => setHeaderConfig({ ...headerConfig, options: { ...headerConfig.options, sticky: e.target.checked } })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span style={{ color: tokens.color.text, fontSize: 14 }}>Sticky header</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={headerConfig.options?.transparent || false}
                        onChange={(e) => setHeaderConfig({ ...headerConfig, options: { ...headerConfig.options, transparent: e.target.checked } })}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span style={{ color: tokens.color.text, fontSize: 14 }}>Transparent background</span>
                    </label>
                  </div>
                </div>

                <div style={{ paddingTop: 24, borderTop: `1px solid ${tokens.color.border}` }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={async () => {
                        setSaving(true);
                        await handleSaveHeader();
                        setSaving(false);
                      }} 
                      icon={saving ? "ri-loader-4-line" : "ri-save-3-fill"}
                      fullWidth
                      style={{
                        background: saving 
                          ? 'rgba(245,211,147,0.3)' 
                          : `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                        color: saving ? tokens.color.muted : '#0b0c0f',
                        fontWeight: 700,
                        fontSize: 15,
                        padding: '16px 32px',
                        borderRadius: '14px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: saving 
                          ? 'none' 
                          : '0 8px 24px rgba(245,211,147,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      disabled={saving}
                    >
                      {saving && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-block', marginRight: 8 }}
                        >
                          <i className="ri-loader-4-line" style={{ fontSize: 18 }} />
                        </motion.div>
                      )}
                      {saving ? 'Saving to all pages...' : '💾 Save Header Configuration'}
                    </Button>
                  </motion.div>
                  <p style={{ 
                    color: tokens.color.muted, 
                    fontSize: 13, 
                    marginTop: 12,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}>
                    <i className="ri-information-line" style={{ marginRight: 4 }} />
                    Changes will apply to all pages (home, menu, about, gallery, contact)
                  </p>
                </div>
              </div>
            </Card>

            {/* Footer Config */}
            <Card icon="ri-layout-bottom-2-line" title="Footer Configuration" subtitle="Tùy chỉnh brand, links, newsletter và social media">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Brand Section */}
                <div>
                  <h3 style={{ color: tokens.color.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Brand Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    <Input
                      label="Brand Name"
                      value={footerConfig.brand?.text || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, text: value } })}
                      placeholder="Restaurant Name"
                      fullWidth
                    />
                    <Input
                      label="Brand Icon"
                      value={footerConfig.brand?.icon || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, icon: value } })}
                      placeholder="ri-restaurant-2-fill"
                      fullWidth
                    />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Input
                      label="Tagline"
                      value={footerConfig.brand?.tagline || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, brand: { ...footerConfig.brand, tagline: value } })}
                      placeholder="Fine dining experience"
                      fullWidth
                    />
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      flex: 1,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(59,130,246,0.05))',
                      borderRadius: '12px',
                      border: '1px solid rgba(245,211,147,0.2)',
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(59,130,246,0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(245,211,147,0.3)',
                      }}>
                        <i className="ri-links-line" style={{ fontSize: 20, color: tokens.color.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: tokens.color.text, fontSize: 17, fontWeight: 700, margin: 0 }}>
                          Quick Links
                        </h3>
                        <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0 0' }}>
                          <i className="ri-drag-move-2-line" style={{ marginRight: 4 }} />
                          Drag to reorder • {footerConfig.quickLinks?.length || 0} links
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const newLinks = [...(footerConfig.quickLinks || []), { label: 'New Link', link: '' }];
                        setFooterConfig({ ...footerConfig, quickLinks: newLinks });
                      }}
                      icon="ri-add-line"
                      size="sm"
                    >
                      Add Link
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {footerConfig.quickLinks?.map((link, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={(e) => handleQuickLinkDragStart(e, index)}
                        onDragOver={handleQuickLinkDragOver}
                        onDrop={(e) => handleQuickLinkDrop(e, index)}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'auto 1fr 1fr auto', 
                          gap: 12,
                          padding: 16,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: tokens.radius.md,
                          border: `1px solid ${tokens.color.border}`,
                          cursor: 'grab',
                          transition: 'all 0.2s ease',
                        }}
                        onDragEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
                          e.currentTarget.style.borderColor = tokens.color.primary;
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = tokens.color.border;
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: tokens.color.muted,
                          fontSize: 18,
                          cursor: 'grab',
                        }}>
                          <i className="ri-drag-move-2-fill" />
                        </div>
                        <Input
                          label="Label"
                          value={link.label}
                          onChange={(value) => {
                            const newLinks = [...(footerConfig.quickLinks || [])];
                            newLinks[index] = { ...newLinks[index], label: value };
                            setFooterConfig({ ...footerConfig, quickLinks: newLinks });
                          }}
                          placeholder="About Us"
                          fullWidth
                        />
                        <Input
                          label="Link"
                          value={link.link}
                          onChange={(value) => {
                            const newLinks = [...(footerConfig.quickLinks || [])];
                            newLinks[index] = { ...newLinks[index], link: value };
                            setFooterConfig({ ...footerConfig, quickLinks: newLinks });
                          }}
                          placeholder="/about"
                          fullWidth
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const newLinks = footerConfig.quickLinks?.filter((_, i) => i !== index);
                            setFooterConfig({ ...footerConfig, quickLinks: newLinks });
                          }}
                          style={{
                            alignSelf: 'flex-end',
                            width: 36,
                            height: 36,
                            borderRadius: tokens.radius.sm,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <i className="ri-delete-bin-line" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Newsletter */}
                <div>
                  <h3 style={{ color: tokens.color.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Newsletter Subscription
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <Input
                      label="Section Title"
                      value={footerConfig.newsletter?.title || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, newsletter: { ...footerConfig.newsletter, title: value } })}
                      placeholder="Subscribe to our newsletter"
                      fullWidth
                    />
                    <Input
                      label="Input Placeholder"
                      value={footerConfig.newsletter?.placeholder || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, newsletter: { ...footerConfig.newsletter, placeholder: value } })}
                      placeholder="Enter your email"
                      fullWidth
                    />
                    <Input
                      label="Button Text"
                      value={footerConfig.newsletter?.buttonText || ''}
                      onChange={(value) => setFooterConfig({ ...footerConfig, newsletter: { ...footerConfig.newsletter, buttonText: value } })}
                      placeholder="Subscribe"
                      fullWidth
                    />
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12,
                      flex: 1,
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(245,211,147,0.1), rgba(59,130,246,0.05))',
                      borderRadius: '12px',
                      border: '1px solid rgba(245,211,147,0.2)',
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, rgba(245,211,147,0.2), rgba(59,130,246,0.1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(245,211,147,0.3)',
                      }}>
                        <i className="ri-share-line" style={{ fontSize: 20, color: tokens.color.primary }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: tokens.color.text, fontSize: 17, fontWeight: 700, margin: 0 }}>
                          Social Media Links
                        </h3>
                        <p style={{ color: tokens.color.muted, fontSize: 12, margin: '2px 0 0 0' }}>
                          <i className="ri-drag-move-2-line" style={{ marginRight: 4 }} />
                          Drag to reorder • {footerConfig.social?.length || 0} platforms
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const newSocial = [...(footerConfig.social || []), { platform: 'Platform', url: '', icon: 'ri-link' }];
                        setFooterConfig({ ...footerConfig, social: newSocial });
                      }}
                      icon="ri-add-line"
                      size="sm"
                    >
                      Add Social
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {footerConfig.social?.map((social, index) => (
                      <div 
                        key={index} 
                        draggable
                        onDragStart={(e) => handleSocialDragStart(e, index)}
                        onDragOver={handleSocialDragOver}
                        onDrop={(e) => handleSocialDrop(e, index)}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'auto 1fr 1fr 1fr auto', 
                          gap: 12,
                          padding: 16,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: tokens.radius.md,
                          border: `1px solid ${tokens.color.border}`,
                          cursor: 'grab',
                          transition: 'all 0.2s ease',
                        }}
                        onDragEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(245,211,147,0.1)';
                          e.currentTarget.style.borderColor = tokens.color.primary;
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = tokens.color.border;
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          color: tokens.color.muted,
                          fontSize: 18,
                          cursor: 'grab',
                        }}>
                          <i className="ri-drag-move-2-fill" />
                        </div>
                        <Input
                          label="Platform"
                          value={social.platform}
                          onChange={(value) => {
                            const newSocial = [...(footerConfig.social || [])];
                            newSocial[index] = { ...newSocial[index], platform: value };
                            setFooterConfig({ ...footerConfig, social: newSocial });
                          }}
                          placeholder="Facebook"
                          fullWidth
                        />
                        <Input
                          label="URL"
                          value={social.url}
                          onChange={(value) => {
                            const newSocial = [...(footerConfig.social || [])];
                            newSocial[index] = { ...newSocial[index], url: value };
                            setFooterConfig({ ...footerConfig, social: newSocial });
                          }}
                          placeholder="https://facebook.com/..."
                          fullWidth
                        />
                        <Input
                          label="Icon"
                          value={social.icon}
                          onChange={(value) => {
                            const newSocial = [...(footerConfig.social || [])];
                            newSocial[index] = { ...newSocial[index], icon: value };
                            setFooterConfig({ ...footerConfig, social: newSocial });
                          }}
                          placeholder="ri-facebook-fill"
                          fullWidth
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            const newSocial = footerConfig.social?.filter((_, i) => i !== index);
                            setFooterConfig({ ...footerConfig, social: newSocial });
                          }}
                          style={{
                            alignSelf: 'flex-end',
                            width: 36,
                            height: 36,
                            borderRadius: tokens.radius.sm,
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 2,
                          }}
                        >
                          <i className="ri-delete-bin-line" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copyright */}
                <div>
                  <h3 style={{ color: tokens.color.text, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
                    Copyright Notice
                  </h3>
                  <Input
                    label="Copyright Text"
                    value={footerConfig.copyright?.text || ''}
                    onChange={(value) => setFooterConfig({ ...footerConfig, copyright: { ...footerConfig.copyright, text: value } })}
                    placeholder="© 2024 Restaurant. All rights reserved."
                    fullWidth
                  />
                </div>

                <div style={{ paddingTop: 24, borderTop: `1px solid ${tokens.color.border}` }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={async () => {
                        setSaving(true);
                        await handleSaveFooter();
                        setSaving(false);
                      }} 
                      icon={saving ? "ri-loader-4-line" : "ri-save-3-fill"}
                      fullWidth
                      style={{
                        background: saving 
                          ? 'rgba(245,211,147,0.3)' 
                          : `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                        color: saving ? tokens.color.muted : '#0b0c0f',
                        fontWeight: 700,
                        fontSize: 15,
                        padding: '16px 32px',
                        borderRadius: '14px',
                        border: 'none',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: saving 
                          ? 'none' 
                          : '0 8px 24px rgba(245,211,147,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      disabled={saving}
                    >
                      {saving && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-block', marginRight: 8 }}
                        >
                          <i className="ri-loader-4-line" style={{ fontSize: 18 }} />
                        </motion.div>
                      )}
                      {saving ? 'Saving to all pages...' : '💾 Save Footer Configuration'}
                    </Button>
                  </motion.div>
                  <p style={{ 
                    color: tokens.color.muted, 
                    fontSize: 13, 
                    marginTop: 12,
                    textAlign: 'center',
                    opacity: 0.8,
                  }}>
                    <i className="ri-information-line" style={{ marginRight: 4 }} />
                    Changes will apply to all pages (home, menu, about, gallery, contact)
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Restaurant Settings */}
      {activeTab === 'restaurant' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card icon="ri-building-2-line" title="Restaurant Information" subtitle="Thông tin cơ bản về nhà hàng">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Logo Upload Section - Moved from Header Settings */}
              <div style={{ 
                marginBottom: 24, 
                padding: 20,
                background: 'linear-gradient(135deg, rgba(245,211,147,0.08), rgba(59,130,246,0.05))',
                borderRadius: 16,
                border: '1px solid rgba(245,211,147,0.2)',
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 20,
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245,211,147,0.25), rgba(59,130,246,0.15))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(245,211,147,0.3)',
                  }}>
                    <i className="ri-image-line" style={{ fontSize: 24, color: tokens.color.primary }} />
                  </div>
                  <div>
                    <h3 style={{ color: tokens.color.text, fontSize: 18, fontWeight: 700, margin: 0 }}>
                      Restaurant Logo
                    </h3>
                    <p style={{ color: tokens.color.muted, fontSize: 13, margin: '4px 0 0 0' }}>
                      Upload once, appears in both header and footer automatically
                    </p>
                  </div>
                </div>

                {/* Logo Preview */}
                {headerConfig.logo?.imageUrl && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                      marginBottom: 20,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 20,
                      padding: 20,
                      background: 'white',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    <img 
                      src={`http://localhost:4202${headerConfig.logo.imageUrl}`}
                      alt="Restaurant logo preview"
                      style={{ 
                        maxHeight: 80,
                        maxWidth: 250,
                        objectFit: 'contain',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        color: '#0b0c0f', 
                        fontSize: 14, 
                        fontWeight: 600, 
                        marginBottom: 4,
                      }}>
                        ✅ Logo uploaded successfully
                      </p>
                      <p style={{ 
                        color: '#6b7280', 
                        fontSize: 12, 
                        margin: 0,
                      }}>
                        This logo will appear in header and footer
                      </p>
                    </div>
                  <Button
                    onClick={async () => {
                      if (confirm('Remove logo from header and footer? This will permanently delete the logo files.')) {
                        try {
                          setSaving(true);
                          
                          // Extract logo ID from URL (e.g., /media/logos/abc-123.webp -> abc-123)
                          const logoUrl = headerConfig.logo?.imageUrl;
                          console.log('🔍 Current logo URL:', logoUrl);
                          
                          if (logoUrl) {
                            // Extract filename from URL: /media/logos/{id}.webp
                            const filename = logoUrl.split('/').pop();
                            console.log('🔍 Extracted filename:', filename);
                            
                            if (filename) {
                              // Remove .webp extension and any suffixes (-thumb, -favicon)
                              const logoId = filename.replace(/(-thumb|-favicon)?\.webp$/, '');
                              console.log('🔍 Logo ID to delete:', logoId);
                              console.log('🔍 DELETE URL:', `http://localhost:4202/media/logo/${logoId}`);
                              
                              // Try to delete logo files from server
                              const response = await fetch(`http://localhost:4202/media/logo/${logoId}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              
                              console.log('🔍 DELETE response status:', response.status);
                              const responseData = await response.json().catch(() => ({}));
                              console.log('🔍 DELETE response data:', responseData);
                              
                              // Handle 404 gracefully (logo file exists but no DB record - orphaned file)
                              if (!response.ok && response.status !== 404) {
                                throw new Error(`Failed to delete logo: ${response.status} - ${JSON.stringify(responseData)}`);
                              }
                              
                              if (response.ok) {
                                console.log('✅ Logo files deleted from server:', logoId);
                              } else if (response.status === 404) {
                                console.warn('⚠️ Logo not in database (orphaned file), removing from config only');
                              }
                            }
                          }
                          
                          // Update config to remove logo (set to empty string to ensure it's saved)
                          const updatedHeaderConfig = { 
                            ...headerConfig, 
                            logo: { ...headerConfig.logo, imageUrl: '' } 
                          };
                          setHeaderConfig(updatedHeaderConfig);
                          
                          // Save to database (footer will auto-sync logo from header)
                          await handleSaveHeader(updatedHeaderConfig);
                          await handleSaveFooter();
                          
                          showSavedMessage('✅ Logo removed successfully!');
                        } catch (error) {
                          alert('Failed to remove logo. Please try again.');
                          console.error('Logo removal error:', error);
                        } finally {
                          setSaving(false);
                        }
                      }
                    }}
                    variant="secondary"
                    style={{ fontSize: 14 }}
                  >
                    <i className="ri-delete-bin-line" style={{ marginRight: 6 }} />
                    Remove Logo
                  </Button>
                  </motion.div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File too large! Please choose an image under 5MB.');
                      return;
                    }
                    
                    try {
                      setSaving(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const response = await fetch('http://localhost:4202/media/logo', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      });
                      
                      if (!response.ok) {
                        throw new Error('Upload failed');
                      }
                      
                      const result = await response.json();
                      
                      // Update header config with logo
                      const updatedHeaderConfig = { 
                        ...headerConfig, 
                        logo: { 
                          ...headerConfig.logo, 
                          imageUrl: result.url 
                        } 
                      };
                      setHeaderConfig(updatedHeaderConfig);
                      
                      // Auto-save to both header and footer with updated config
                      await handleSaveHeader(updatedHeaderConfig);
                      await handleSaveFooter();
                      
                      showSavedMessage('✅ Logo uploaded and synced to header & footer!');
                    } catch (error) {
                      alert('Failed to upload logo. Please try again.');
                      console.error('Logo upload error:', error);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px dashed ${tokens.color.primary}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: tokens.color.text,
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                />
                <p style={{ 
                  color: tokens.color.muted, 
                  fontSize: 12, 
                  marginTop: 12,
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <i className="ri-information-line" />
                  Recommended: PNG or SVG with transparent background, max 5MB. Will be automatically optimized and synced to header & footer.
                </p>
              </div>

              {/* Background Image Upload */}
              <div style={{ marginTop: 32 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: tokens.color.text, 
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <i className="ri-image-2-line" style={{ fontSize: 18, color: tokens.color.primary }} />
                  Page Background Image
                </label>
                
                <p style={{ 
                  color: tokens.color.muted, 
                  fontSize: 12, 
                  marginTop: -8,
                  marginBottom: 12,
                }}>
                  Upload a background image for the entire landing page. Recommended: 1920x1080px or larger, high-quality restaurant interior photo.
                </p>
                
                {restaurantSettings.backgroundImage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                      marginBottom: 16,
                      padding: 16,
                      background: 'rgba(245,211,147,0.05)',
                      borderRadius: 12,
                      border: '1px solid rgba(245,211,147,0.2)',
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <span style={{ 
                        color: tokens.color.primary, 
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <i className="ri-checkbox-circle-fill" />
                        Current Background
                      </span>
                    </div>
                    <img
                      src={`http://localhost:4202${restaurantSettings.backgroundImage}`}
                      alt="Page Background"
                      onError={(e) => {
                        // File not found - show warning
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const warning = target.nextElementSibling as HTMLElement;
                        if (warning) warning.style.display = 'block';
                      }}
                      style={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    <div
                      style={{
                        display: 'none',
                        padding: 16,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        marginBottom: 12,
                        color: '#ef4444',
                        fontSize: 13,
                      }}
                    >
                      <i className="ri-error-warning-line" style={{ marginRight: 6 }} />
                      ⚠️ Background file not found on server. Please remove this setting and upload a new background.
                    </div>
                    <Button
                      onClick={async () => {
                        if (confirm('Remove page background image? This will use the default restaurant interior image.')) {
                          try {
                            setSaving(true);
                            
                            // Delete from server if it's a media file
                            if (restaurantSettings.backgroundImage?.startsWith('/media/')) {
                              const bgId = restaurantSettings.backgroundImage.split('/').pop()?.split('.')[0];
                              if (bgId) {
                                const response = await fetch(`http://localhost:4202/media/backgrounds/${bgId}`, {
                                  method: 'DELETE',
                                  credentials: 'include',
                                });
                                if (response.ok) {
                                  console.log('✅ Background deleted from server:', bgId);
                                } else if (response.status === 404) {
                                  console.warn('⚠️ Background not in database, removing from config only');
                                }
                              }
                            }
                            
                            // Update restaurant settings (set to empty string to ensure it's saved)
                            const updatedSettings = { 
                              ...restaurantSettings, 
                              backgroundImage: '' 
                            };
                            setRestaurantSettings(updatedSettings);
                            
                            // Save to database
                            await fetch('http://localhost:4202/settings/restaurant', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ value: updatedSettings }),
                              credentials: 'include',
                            });
                            
                            showSavedMessage('✅ Background removed successfully!');
                          } catch (error) {
                            alert('Failed to remove background. Please try again.');
                            console.error('Background removal error:', error);
                          } finally {
                            setSaving(false);
                          }
                        }
                      }}
                      variant="secondary"
                      style={{ fontSize: 14 }}
                    >
                      <i className="ri-delete-bin-line" style={{ marginRight: 6 }} />
                      Remove Background
                    </Button>
                  </motion.div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    // Validate file size (max 10MB for backgrounds)
                    if (file.size > 10 * 1024 * 1024) {
                      alert('File too large! Please choose an image under 10MB.');
                      return;
                    }
                    
                    try {
                      setSaving(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const response = await fetch('http://localhost:4202/media/backgrounds', {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      });
                      
                      if (!response.ok) {
                        throw new Error('Upload failed');
                      }
                      
                      const result = await response.json();
                      
                      // Update restaurant settings with background
                      const updatedSettings = { 
                        ...restaurantSettings, 
                        backgroundImage: result.url 
                      };
                      setRestaurantSettings(updatedSettings);
                      
                      // Save to database
                      await fetch('http://localhost:4202/settings/restaurant', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ value: updatedSettings }),
                        credentials: 'include',
                      });
                      
                      showSavedMessage('✅ Background uploaded successfully!');
                    } catch (error) {
                      alert('Failed to upload background. Please try again.');
                      console.error('Background upload error:', error);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: 12,
                    border: `2px dashed ${tokens.color.primary}`,
                    background: 'rgba(255,255,255,0.05)',
                    color: tokens.color.text,
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                />
                <p style={{ 
                  color: tokens.color.muted, 
                  fontSize: 12, 
                  marginTop: 12,
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <i className="ri-information-line" />
                  Recommended: High-quality image (1920x1080 or larger), max 10MB. Will be used as Hero section background.
                </p>
              </div>

              <Input
                label="Restaurant Name"
                value={restaurantSettings.name}
                onChange={(value) => setRestaurantSettings({ ...restaurantSettings, name: value })}
                placeholder="The Divine Cuisine"
                fullWidth
              />

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                  Description
                </label>
                <textarea
                  value={restaurantSettings.description}
                  onChange={(e) => setRestaurantSettings({ ...restaurantSettings, description: e.target.value })}
                  placeholder="Brief description of your restaurant..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Input
                label="Address"
                value={restaurantSettings.address}
                onChange={(value) => setRestaurantSettings({ ...restaurantSettings, address: value })}
                placeholder="123 Gourmet Street, Food City"
                fullWidth
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <Input
                  label="Phone"
                  value={restaurantSettings.phone}
                  onChange={(value) => setRestaurantSettings({ ...restaurantSettings, phone: value })}
                  placeholder="+84 123 456 789"
                  fullWidth
                />

                <Input
                  label="Email"
                  type="email"
                  value={restaurantSettings.email}
                  onChange={(value) => setRestaurantSettings({ ...restaurantSettings, email: value })}
                  placeholder="contact@restaurant.com"
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <Input
                  label="Website"
                  value={restaurantSettings.website}
                  onChange={(value) => setRestaurantSettings({ ...restaurantSettings, website: value })}
                  placeholder="https://restaurant.com"
                  fullWidth
                />

                <Input
                  label="Opening Hours"
                  value={restaurantSettings.openingHours}
                  onChange={(value) => setRestaurantSettings({ ...restaurantSettings, openingHours: value })}
                  placeholder="10:00 - 22:00"
                  fullWidth
                />
              </div>

              <div style={{ paddingTop: 16 }}>
                <Button 
                  onClick={handleSaveRestaurant} 
                  icon={saving ? "ri-loader-4-line" : "ri-save-line"}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Restaurant Info'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Theme Settings */}
      {activeTab === 'theme' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card icon="ri-palette-line" title="Theme Customization" subtitle="Tùy chỉnh màu sắc và font chữ">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                    Primary Color
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="color"
                      value={themeSettings.primaryColor}
                      onChange={(e) => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                      style={{
                        width: 60,
                        height: 48,
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                      }}
                    />
                    <Input
                      value={themeSettings.primaryColor}
                      onChange={(value) => setThemeSettings({ ...themeSettings, primaryColor: value })}
                      placeholder="#f5d393"
                      fullWidth
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      type="color"
                      value={themeSettings.accentColor}
                      onChange={(e) => setThemeSettings({ ...themeSettings, accentColor: e.target.value })}
                      style={{
                        width: 60,
                        height: 48,
                        borderRadius: tokens.radius.md,
                        border: `1px solid ${tokens.color.border}`,
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                      }}
                    />
                    <Input
                      value={themeSettings.accentColor}
                      onChange={(value) => setThemeSettings({ ...themeSettings, accentColor: value })}
                      placeholder="#3b82f6"
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: tokens.color.text, marginBottom: 8 }}>
                  Font Family
                </label>
                <select
                  value={themeSettings.fontFamily}
                  onChange={(e) => setThemeSettings({ ...themeSettings, fontFamily: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.md,
                    color: tokens.color.text,
                    fontSize: 14,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>

              {/* Preview */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.lg,
                  padding: 24,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 500, color: tokens.color.muted, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Preview
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: tokens.radius.md,
                      background: themeSettings.primaryColor + '20',
                      color: themeSettings.primaryColor,
                      fontFamily: themeSettings.fontFamily,
                      fontWeight: 500,
                    }}
                  >
                    Primary Color Sample Text
                  </div>
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: tokens.radius.md,
                      background: themeSettings.accentColor + '20',
                      color: themeSettings.accentColor,
                      fontFamily: themeSettings.fontFamily,
                      fontWeight: 500,
                    }}
                  >
                    Accent Color Sample Text
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: 16 }}>
                <Button 
                  onClick={handleSaveTheme} 
                  icon={saving ? "ri-loader-4-line" : "ri-save-line"}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Theme Settings'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card icon="ri-notification-3-line" title="Notification Preferences" subtitle="Quản lý thông báo email và hệ thống">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Nhận thông báo qua email' },
                { key: 'newReservations', label: 'New Reservations', desc: 'Thông báo khi có đặt bàn mới' },
                { key: 'newComments', label: 'New Comments', desc: 'Thông báo khi có comment mới trên blog' },
                { key: 'systemUpdates', label: 'System Updates', desc: 'Thông báo về updates và maintenance' },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: tokens.radius.md,
                    border: `1px solid ${tokens.color.border}`,
                  }}
                >
                  <div>
                    <h3 style={{ color: tokens.color.text, fontWeight: 500, marginBottom: 4 }}>{label}</h3>
                    <p style={{ fontSize: 13, color: tokens.color.muted, margin: 0 }}>{desc}</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationSettings[key as keyof NotificationSettings] as boolean}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [key]: e.target.checked,
                        })
                      }
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        background: notificationSettings[key as keyof NotificationSettings]
                          ? tokens.color.primary
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: notificationSettings[key as keyof NotificationSettings] ? 22 : 2,
                          width: 20,
                          height: 20,
                          background: '#fff',
                          borderRadius: '50%',
                          transition: 'all 0.2s',
                        }}
                      />
                    </div>
                  </label>
                </div>
              ))}

              <div style={{ paddingTop: 16 }}>
                <Button onClick={handleSaveNotifications} icon="ri-save-line">
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
