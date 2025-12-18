import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@app/ui';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';

import { SectionsPage } from './pages/SectionsPage';
import { MediaPage } from './pages/MediaPage';
import { LivePreviewPage } from './pages/LivePreviewPage';
import { BlogManagerPage } from './pages/BlogManagerPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeadsPage } from './pages/LeadsPage';
import { PricingConfigPage } from './pages/PricingConfigPage';
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
    const refreshToken = tokenStorage.getRefreshToken();
    
    console.log('🔐 Auth check on mount:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : null,
    });
    
    if (!accessToken) {
      console.log('🔐 No access token found, redirecting to login');
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((userData) => {
        console.log('🔐 Auth check successful:', userData);
        store.setUser(userData as Parameters<typeof store.setUser>[0]);
      })
      .catch((error) => {
        // Token invalid or expired, clear tokens and user state
        console.error('🔐 Auth check failed:', error);
        tokenStorage.clearTokens();
        store.setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
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
          background: '#0b0c0f',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#f5d393',
          }}
        />
      </div>
    );
  }

  if (!user) {
    return location.pathname === '/login' ? <LoginPage /> : <Navigate to="/login" replace />;
  }

  // Get current route from pathname
  const currentRoute = location.pathname.split('/')[1] as RouteType || 'dashboard';

  return (
    <Layout 
      currentRoute={currentRoute}
      onNavigate={(route, slug) => navigate(slug ? `/${route}/${slug}` : `/${route}`)}
      onLogout={handleLogout} 
      userEmail={user.email}
    >
      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
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
              <Route path="/pricing-config" element={<PricingConfigPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/preview" element={<LivePreviewPage />} />
              <Route path="/blog-manager" element={<BlogManagerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
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
