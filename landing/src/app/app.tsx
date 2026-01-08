// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion, useScroll } from 'framer-motion';
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@app/ui';
import { ToastProvider } from './components/Toast';
import { MobileMenu } from './components/MobileMenu';
import { ScrollProgress } from './components/ScrollProgress';
import { FloatingActions } from './sections/FloatingActions';
import { PromoPopup } from './components/PromoPopup';
import { Header, type HeaderConfig } from './components/Header';
import { Footer, type FooterConfig } from './components/Footer';
import type { PageData } from './types';

// Lazy load all pages for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const QuotePage = lazy(() => import('./pages/QuotePage').then(m => ({ default: m.QuotePage })));
const QuotationResultPage = lazy(() => import('./pages/QuotationResultPage').then(m => ({ default: m.QuotationResultPage })));
// GalleryPage removed - không còn sử dụng
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const DynamicPage = lazy(() => import('./pages/DynamicPage').then(m => ({ default: m.DynamicPage })));
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage').then(m => ({ default: m.UnsubscribePage })));

// Create QueryClient instance for API caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
});

// Main App Content Component (uses router hooks)
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load header and footer config from localStorage as fallback (admin settings)
  const [headerConfigFromSettings, setHeaderConfigFromSettings] = useState<HeaderConfig | null>(null);
  const [footerConfigFromSettings, setFooterConfigFromSettings] = useState<FooterConfig | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  // Logo from company settings (logos array with position)
  const [companyLogos, setCompanyLogos] = useState<Array<{ position: string; url: string }>>([]);

  useEffect(() => {
    // Only use localStorage if page data is not available yet (fallback)
    // Page data from API will override this via headerConfig/footerConfig fields
    if (!page) {
      const savedHeader = localStorage.getItem('headerConfig');
      const savedFooter = localStorage.getItem('footerConfig');
      if (savedHeader) {
        try {
          setHeaderConfigFromSettings(JSON.parse(savedHeader));
        } catch (e) {
          console.error('Failed to parse header config:', e);
        }
      }
      if (savedFooter) {
        try {
          setFooterConfigFromSettings(JSON.parse(savedFooter));
        } catch (e) {
          console.error('Failed to parse footer config:', e);
        }
      }
    } else {
      // Clear localStorage when page data is loaded (DB is source of truth now)
      if (localStorage.getItem('headerConfig') || localStorage.getItem('footerConfig')) {
        localStorage.removeItem('headerConfig');
        localStorage.removeItem('footerConfig');
        setHeaderConfigFromSettings(null);
        setFooterConfigFromSettings(null);
      }
    }
  }, [page]);

  // Load company settings for background image and logos
  useEffect(() => {
    fetch(`${API_URL}/settings/company`)
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        // Unwrap standardized response format { success: true, data: T }
        const data = json.data || json;
        const settings = data.value || data; // Handle both {key, value} and direct object
        
        // Load background image
        if (settings.backgroundImage && settings.backgroundImage.trim()) {
          const bgUrl = resolveMediaUrl(settings.backgroundImage);
          
          // Validate image exists before setting
          const img = new Image();
          img.onload = () => {
            setBackgroundImage(bgUrl);
          };
          img.onerror = () => {
            setBackgroundImage(null); // Fallback to default
          };
          img.src = bgUrl;
        } else {
          // Clear background image if it was deleted or is empty
          setBackgroundImage(null);
        }
        
        // Load logos from company settings
        if (settings.logos && Array.isArray(settings.logos)) {
          setCompanyLogos(settings.logos);
          
          // Update favicon if available
          const faviconLogo = settings.logos.find((l: { position: string; url: string }) => l.position === 'favicon');
          if (faviconLogo && faviconLogo.url) {
            // Remove existing favicons
            const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
            existingFavicons.forEach(el => el.remove());
            
            // Add new favicon
            const faviconUrl = resolveMediaUrl(faviconLogo.url);
            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = faviconUrl;
            document.head.appendChild(link);
            
            // Also add apple-touch-icon for iOS
            const appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.href = faviconUrl;
            document.head.appendChild(appleLink);
          }
        }
      })
      .catch(() => {
        // Silently fail - use default background
      });
  }, []);

  // Apply background image to body element
  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = `
        linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%),
        url("${backgroundImage}")
      `;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      // Default background - elegant interior design theme
      document.body.style.backgroundImage = `
        linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.65) 100%),
        url("https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=40")
      `;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [backgroundImage]);

  // Function to fetch page data
  const fetchPageData = () => {
    setLoading(true);
    
    // Mock data cho development (khi API chưa có data)
    const mockData = {
      id: '1',
      slug: 'home',
      title: 'Nội Thất Nhanh - Giải pháp nội thất trọn gói',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: '1',
          kind: 'HERO',
          order: 1,
          data: {
            title: 'Nội Thất Nhanh',
            subtitle: 'Giải pháp nội thất trọn gói cho căn hộ, nhà phố - Thiết kế miễn phí, thi công nhanh chóng',
            imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
            ctaText: 'Báo Giá Ngay',
            ctaLink: '/bao-gia'
          }
        },
        {
          id: '2',
          kind: 'SERVICES',
          order: 2,
          data: {
            title: 'Dịch Vụ Của Chúng Tôi',
            subtitle: 'Giải pháp toàn diện cho ngôi nhà của bạn',
            services: [
              { icon: 'ri-home-smile-line', title: 'Nội thất căn hộ', description: 'Thiết kế và thi công nội thất căn hộ trọn gói' },
              { icon: 'ri-building-line', title: 'Nội thất nhà phố', description: 'Giải pháp nội thất cho nhà phố, biệt thự' },
              { icon: 'ri-sofa-line', title: 'Nội thất theo yêu cầu', description: 'Thiết kế riêng theo phong cách của bạn' },
              { icon: 'ri-tools-line', title: 'Thi công chuyên nghiệp', description: 'Đội ngũ thợ lành nghề, thi công nhanh chóng' }
            ]
          }
        },
        {
          id: '3',
          kind: 'CTA',
          order: 3,
          data: {
            title: 'Nhận Báo Giá Miễn Phí',
            description: 'Chỉ cần chọn căn hộ và sản phẩm, hệ thống sẽ tự động tính toán chi phí dự kiến',
            buttonText: 'Báo Giá Ngay',
            buttonLink: '/bao-gia'
          }
        }
      ],
      headerConfig: undefined,
      footerConfig: undefined,
    };

    fetch(`${API_URL}/pages/home`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        // Unwrap standardized response format { success: true, data: T }
        const data = json.data || json;
        setPage(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch page data:', err);
        setError(err.message);
        // Use mock data as fallback
        setPage(mockData as PageData);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // Fetch page data based on current route
  const getPageSlug = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/blog/')) return 'blog'; // Blog detail uses blog page
    return pathname.substring(1); // Remove leading slash
  };

  const currentPageSlug = getPageSlug(location.pathname);
  
  // Fetch page data for current route
  const [currentPage, setCurrentPage] = useState<PageData | null>(null);
  
  useEffect(() => {
    if (currentPageSlug === 'home') {
      setCurrentPage(page); // Use already fetched home page
      return;
    }

    // Fetch page data for other routes
    fetch(`${API_URL}/pages/${currentPageSlug}`)
      .then((res) => {
        if (!res.ok) {
          // Page doesn't exist in DB, use empty page with default config
          return null;
        }
        return res.json();
      })
      .then((json) => {
        // Unwrap standardized response format { success: true, data: T }
        const data = json ? (json.data || json) : null;
        setCurrentPage(data);
      })
      .catch((err) => {
        console.error(`Failed to fetch page data for ${currentPageSlug}:`, err);
        setCurrentPage(null);
      });
  }, [location.pathname, page, currentPageSlug]);

  // Navigation helper
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Scroll progress for potential future use
  useScroll();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.color.background,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            borderWidth: '4px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </div>
    );
  }

  if (error && !page) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.color.background,
          color: tokens.color.text,
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Error Loading Page</h1>
          <p style={{ color: tokens.color.textMuted }}>{error}</p>
          <button
            onClick={fetchPageData}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: tokens.color.primary,
              color: tokens.color.background,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Header - render from DATABASE FIRST (page config), then localStorage fallback */}
      <Header
        config={(() => {
          // Get header config from DATABASE first, then settings
          const headerConfig = page?.headerConfig
            ? (typeof page.headerConfig === 'string'
                ? JSON.parse(page.headerConfig)
                : page.headerConfig)
            : (headerConfigFromSettings ?? {
                logo: {
                  text: page?.title ?? 'Nội Thất Nhanh',
                  icon: 'ri-home-smile-fill',
                },
                navigation: [
                  { label: 'Trang chủ', path: '/' },
                  { label: 'Báo giá', path: '/bao-gia' },
                  { label: 'Dự án', path: '/gallery' },
                  { label: 'Giới thiệu', path: '/about' },
                  { label: 'Blog', path: '/blog' },
                  { label: 'Liên hệ', path: '/contact' },
                ],
              });
          
          // Override logo with company settings logo (header position) if available
          const headerLogo = companyLogos.find(l => l.position === 'header');
          if (headerLogo && headerLogo.url) {
            return {
              ...headerConfig,
              logo: {
                ...headerConfig?.logo,
                imageUrl: headerLogo.url,
              },
            };
          }
          
          return headerConfig;
        })()}
        mobileMenuComponent={(() => {
          // MobileMenu tự fetch config từ API (bao gồm highlight)
          // Không cần truyền menuItems prop
          return (
            <MobileMenu 
              currentRoute={location.pathname} 
              onNavigate={handleNavigate}
            />
          );
        })()}
      />

      {/* Main Content */}
      <main>
        <ErrorBoundary>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: '50vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
                  }}
                />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={page ? <HomePage page={page} /> : null} />
              <Route path="/bao-gia" element={<QuotePage />} />
              <Route path="/bao-gia/ket-qua/:id" element={<QuotationResultPage />} />
              {/* Gallery page removed */}
              <Route path="/about" element={currentPage ? <AboutPage page={currentPage} /> : null} />
              <Route path="/contact" element={currentPage ? <ContactPage page={currentPage} /> : null} />
              <Route path="/blog" element={<BlogPage page={currentPage || undefined} />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              {/* Unsubscribe page - email notification management */}
              <Route path="/unsubscribe" element={<UnsubscribePage />} />
              {/* Dynamic page route - loads any page from database by slug */}
              <Route path="/:slug" element={<DynamicPage />} />
              {/* 404 fallback */}
              <Route path="*" element={page ? <HomePage page={page} /> : null} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer - render from DATABASE FIRST (page config), then localStorage fallback */}
      <Footer
        config={(() => {
          // Get footer config from DATABASE first, then settings
          let footerConfig = page?.footerConfig
            ? (typeof page.footerConfig === 'string'
                ? JSON.parse(page.footerConfig)
                : page.footerConfig)
            : (footerConfigFromSettings ?? {
                brand: {
                  text: page?.title ?? 'Nội Thất Nhanh',
                  icon: 'ri-home-smile-fill',
                },
                copyright: {
                  text: `© ${new Date().getFullYear()} ${page?.title ?? 'Nội Thất Nhanh'}. All rights reserved.`,
                },
              });

          // Override logo with company settings logo (footer position) if available
          const footerLogo = companyLogos.find(l => l.position === 'footer');
          if (footerLogo && footerLogo.url) {
            footerConfig = {
              ...footerConfig,
              brand: {
                ...footerConfig?.brand,
                imageUrl: footerLogo.url,
              },
            };
            return footerConfig;
          }

          // Sync logo from header config (DB) if footer doesn't have one
          const headerConfigFromDB = page?.headerConfig 
            ? (typeof page.headerConfig === 'string' ? JSON.parse(page.headerConfig) : page.headerConfig)
            : null;
          
          // Only sync if footer has no imageUrl AND header has a valid one (not empty/undefined)
          const footerHasLogo = footerConfig?.brand?.imageUrl && footerConfig.brand.imageUrl.trim();
          const headerHasLogo = headerConfigFromDB?.logo?.imageUrl && headerConfigFromDB.logo.imageUrl.trim();
          
          // Also check company settings header logo
          const headerLogoFromSettings = companyLogos.find(l => l.position === 'header');
          
          if (footerConfig && !footerHasLogo) {
            if (headerHasLogo) {
              footerConfig = {
                ...footerConfig,
                brand: {
                  ...footerConfig.brand,
                  imageUrl: headerConfigFromDB.logo.imageUrl,
                },
              };
            } else if (headerLogoFromSettings && headerLogoFromSettings.url) {
              footerConfig = {
                ...footerConfig,
                brand: {
                  ...footerConfig.brand,
                  imageUrl: headerLogoFromSettings.url,
                },
              };
            }
          }

          return footerConfig;
        })()}
      />

      {/* Floating Action Button Menu - Render from sections data */}
      {!loading && !error && page && (
        <>
          {page.sections
            ?.filter((s) => s.kind === 'FAB_ACTIONS')
            .map((s) => {
              const fabData = typeof s.data === 'string' ? JSON.parse(s.data) : (s.data || {});
              return <FloatingActions key={s.id} data={fabData} />;
            })}
        </>
      )}

      {/* Promo Popup */}
      <PromoPopup />

      {/* Toast Notifications - rendered by ToastProvider */}
    </div>
  );
}

// Main App Component with Router
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
