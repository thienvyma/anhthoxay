import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@app/ui';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { RegionsPage } from './pages/RegionsPage';
import { SectionsPage } from './pages/SectionsPage';
import { MediaPage } from './pages/MediaPage';
import { BlogManagerPage } from './pages/BlogManagerPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeadsPage } from './pages/LeadsPage';
import { PricingConfigPage } from './pages/PricingConfigPage';
import { UsersPage } from './pages/UsersPage';
import { NotificationTemplatesPage } from './pages/NotificationTemplatesPage';
import { FurniturePage } from './pages/FurniturePage';
import { RateLimitPage } from './pages/RateLimitPage';
import { useUser, store, tokenStorage } from './store';
import { authApi } from './api';
import type { RouteType } from './types'

// App Content Component (uses router hooks)
function AppContent() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

	useEffect(() => {
    // Check if user is already logged in (has valid token)
    const accessToken = tokenStorage.getAccessToken();
    
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Use AbortController to cancel request if component unmounts
    const abortController = new AbortController();
    
    authApi
      .me()
      .then((userData) => {
        if (abortController.signal.aborted) return;
        store.setUser(userData as Parameters<typeof store.setUser>[0]);
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        // Token invalid or expired, clear tokens and user state
        // Don't log network errors as they're expected when server is starting
        const errorMessage = (error as Error).message || '';
        if (!errorMessage.includes('Failed to fetch') && !errorMessage.includes('NetworkError')) {
          console.error('Auth check failed:', error);
        }
        tokenStorage.clearTokens();
        store.setUser(null);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });
    
    return () => {
      abortController.abort();
    };
	}, []);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      store.setUser(null);
      navigate('/login');
    }
  }

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F9FA',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '4px solid #E5E7EB',
            borderTopColor: '#F5D393',
          }}
        />
      </div>
    );
  }

  if (!user) {
    return location.pathname === '/login' ? <LoginPage /> : <Navigate to="/login" replace />;
  }

  // Get current route from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let currentRoute: RouteType = 'dashboard';
  
  // Handle nested routes like settings/api-keys
  if (pathSegments.length >= 2 && pathSegments[0] === 'settings' && pathSegments[1] === 'api-keys') {
    currentRoute = 'settings/api-keys';
  } else if (pathSegments.length >= 1) {
    currentRoute = pathSegments[0] as RouteType;
  }

  return (
    <Layout 
      currentRoute={currentRoute}
      onNavigate={(route, slug) => navigate(slug ? `/${route}/${slug}` : `/${route}`)}
      onLogout={handleLogout} 
      userEmail={user.email}
    >
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Unified Pages & Sections route */}
          <Route path="/pages/:slug" element={<SectionsPageWrapper />} />
          <Route path="/pages" element={<SectionsPageWrapper />} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/sections/:slug" element={<SectionsPageWrapper />} />
          <Route path="/sections" element={<Navigate to="/pages/home" replace />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/regions" element={<RegionsPage />} />
          <Route path="/notification-templates" element={<NotificationTemplatesPage />} />
          <Route path="/furniture" element={<FurniturePage />} />
          <Route path="/api-keys" element={<Navigate to="/settings?tab=api-keys" replace />} />
          <Route path="/settings/api-keys" element={<Navigate to="/settings?tab=api-keys" replace />} />
          <Route path="/rate-limits" element={<RateLimitPage />} />
          <Route path="/pricing-config" element={<PricingConfigPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/blog-manager" element={<BlogManagerPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

// Wrapper for SectionsPage to extract slug from URL params
function SectionsPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return <SectionsPage pageSlug={slug || 'home'} />;
}

// Main App Component with Router
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
