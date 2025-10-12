// Uncomment this line to use CSS modules
// import styles from './app.module.css';
import { tokens } from '@app/shared';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { staggerChildren } from '@app/ui';
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer, useToast } from './components/Toast';
import { MobileMenu } from './components/MobileMenu';
import { ScrollProgress } from './components/ScrollProgress';
import { FloatingActions } from './sections/FloatingActions';
import { Header, type HeaderConfig } from './components/Header';
import { Footer, type FooterConfig } from './components/Footer';
import type { PageData, PageMeta, RouteType } from './types';

// Lazy load all pages for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const MenuPage = lazy(() => import('./pages/MenuPage').then(m => ({ default: m.MenuPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then(m => ({ default: m.GalleryPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const ImageHoverTest = lazy(() => import('./pages/ImageHoverTest').then(m => ({ default: m.ImageHoverTest })));

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
  const params = useParams();
  
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  // Load header and footer config from localStorage as fallback (admin settings)
  const [headerConfigFromSettings, setHeaderConfigFromSettings] = useState<HeaderConfig | null>(null);
  const [footerConfigFromSettings, setFooterConfigFromSettings] = useState<FooterConfig | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

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
        console.log('🗑️ Clearing old localStorage configs - using database now');
        localStorage.removeItem('headerConfig');
        localStorage.removeItem('footerConfig');
        setHeaderConfigFromSettings(null);
        setFooterConfigFromSettings(null);
      }
    }
  }, [page]);

  // Load restaurant settings for background image
  useEffect(() => {
    fetch('http://localhost:4202/settings/restaurant')
      .then((res) => res.json())
      .then((data) => {
        const settings = data.value || data; // Handle both {key, value} and direct object
        if (settings.backgroundImage && settings.backgroundImage.trim()) {
          const bgUrl = `http://localhost:4202${settings.backgroundImage}`;
          
          // Validate image exists before setting
          const img = new Image();
          img.onload = () => {
            setBackgroundImage(bgUrl);
          };
          img.onerror = () => {
            console.warn('⚠️ Background image not found, using default:', settings.backgroundImage);
            setBackgroundImage(null); // Fallback to default
          };
          img.src = bgUrl;
        } else {
          // Clear background image if it was deleted or is empty
          setBackgroundImage(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load restaurant settings:', err);
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
      // Default background
      document.body.style.backgroundImage = `
        linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.6) 100%),
        url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=30")
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
      title: 'Nhà Hàng Sang Trọng',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: '1',
          kind: 'HERO',
          order: 1,
          data: {
            title: 'Trải Nghiệm Ẩm Thực Đỉnh Cao',
            subtitle: 'Khám phá hương vị tinh tế với không gian sang trọng và dịch vụ chuyên nghiệp',
            imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
            ctaText: 'Đặt Bàn Ngay',
            ctaLink: '/contact'
          }
        },
        {
          id: '2',
          kind: 'FEATURED_MENU',
          order: 2,
          data: {
            title: 'Thực Đơn Nổi Bật',
            items: [
              {
                name: 'Bò Bít Tết Úc',
                description: 'Thịt bò nhập khẩu, nướng hoàn hảo với sốt tiêu đen',
                price: '450.000đ',
                imageUrl: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500'
              },
              {
                name: 'Hải Sản Nướng Bơ',
                description: 'Tôm hùm, sò điệp, cá hồi tươi nướng bơ tỏi',
                price: '650.000đ',
                imageUrl: 'https://images.unsplash.com/photo-1559737558-2fca2a4fb401?w=500'
              },
              {
                name: 'Pasta Truffle',
                description: 'Mì Ý sốt kem nấm truffle cao cấp',
                price: '380.000đ',
                imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500'
              }
            ]
          }
        },
        {
          id: '3',
          kind: 'CTA',
          order: 3,
          data: {
            title: 'Đặt Bàn Ngay Hôm Nay',
            description: 'Trải nghiệm ẩm thực đẳng cấp với ưu đãi đặc biệt cho khách hàng mới',
            buttonText: 'Liên Hệ Ngay',
            buttonLink: '/contact'
          }
        }
      ],
      headerConfig: undefined,
      footerConfig: undefined,
    };

    fetch('http://localhost:4202/pages/home')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPage(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch page data:', err);
        setError(err.message);
        // Use mock data as fallback
        setPage(mockData);
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
    fetch(`http://localhost:4202/pages/${currentPageSlug}`)
      .then((res) => {
        if (!res.ok) {
          // Page doesn't exist in DB, use empty page with default config
          return null;
        }
        return res.json();
      })
      .then((data) => {
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

  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.2],
    ['rgba(11, 12, 15, 0)', 'rgba(11, 12, 15, 0.95)']
  );

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
            border: `4px solid ${tokens.color.border}`,
            borderTopColor: tokens.color.primary,
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
                  text: page?.title ?? 'Restaurant',
                  icon: 'ri-restaurant-2-fill',
                },
                navigation: [
                  { label: 'Home', path: '/' },
                  { label: 'Menu', path: '/menu' },
                  { label: 'Gallery', path: '/gallery' },
                  { label: 'About', path: '/about' },
                  { label: 'Blog', path: '/blog' },
                  { label: 'Contact', path: '/contact' },
                ],
              });
          return headerConfig;
        })()}
        mobileMenuComponent={<MobileMenu currentRoute={location.pathname} onNavigate={handleNavigate} />}
      />

      {/* Main Content */}
      <main>
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
                  border: `3px solid ${tokens.color.border}`,
                  borderTopColor: tokens.color.primary,
                }}
              />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={page ? <HomePage page={page} /> : null} />
            <Route path="/menu" element={<MenuPage page={currentPage || undefined} />} />
            <Route path="/gallery" element={<GalleryPage page={currentPage || undefined} />} />
            <Route path="/about" element={currentPage ? <AboutPage page={currentPage} /> : null} />
            <Route path="/contact" element={currentPage ? <ContactPage page={currentPage} /> : null} />
            <Route path="/blog" element={<BlogPage page={currentPage || undefined} />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/test-hover" element={<ImageHoverTest />} />
            {/* 404 fallback */}
            <Route path="*" element={page ? <HomePage page={page} /> : null} />
          </Routes>
        </Suspense>
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
                  text: page?.title ?? 'Restaurant',
                  icon: 'ri-restaurant-2-fill',
                },
                copyright: {
                  text: `© ${new Date().getFullYear()} ${page?.title ?? 'Restaurant'}. All rights reserved.`,
                },
              });

          // Sync logo from header config (DB) if footer doesn't have one
          const headerConfigFromDB = page?.headerConfig 
            ? (typeof page.headerConfig === 'string' ? JSON.parse(page.headerConfig) : page.headerConfig)
            : null;
          
          // Only sync if footer has no imageUrl AND header has a valid one (not empty/undefined)
          const footerHasLogo = footerConfig?.brand?.imageUrl && footerConfig.brand.imageUrl.trim();
          const headerHasLogo = headerConfigFromDB?.logo?.imageUrl && headerConfigFromDB.logo.imageUrl.trim();
          
          if (footerConfig && !footerHasLogo && headerHasLogo) {
            footerConfig = {
              ...footerConfig,
              brand: {
                ...footerConfig.brand,
                imageUrl: headerConfigFromDB.logo.imageUrl,
              },
            };
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

// Main App Component with Router
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
