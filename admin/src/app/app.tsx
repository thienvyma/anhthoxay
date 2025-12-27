import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@app/ui';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { DashboardPage } from './pages/DashboardPage';
import { ContractorsPage } from './pages/ContractorsPage';
import { RegionsPage } from './pages/RegionsPage';
import { SectionsPage } from './pages/SectionsPage';
import { MediaPage } from './pages/MediaPage';
import { LivePreviewPage } from './pages/LivePreviewPage';
import { BlogManagerPage } from './pages/BlogManagerPage';
import { SettingsPage } from './pages/SettingsPage';
import { LeadsPage } from './pages/LeadsPage';
import { PricingConfigPage } from './pages/PricingConfigPage';
import { UsersPage } from './pages/UsersPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { BidsPage } from './pages/BidsPage';
import { MatchesPage } from './pages/MatchesPage';
import { FeesPage } from './pages/FeesPage';
import { DisputesPage } from './pages/DisputesPage';
import { NotificationTemplatesPage } from './pages/NotificationTemplatesPage';
import { ChatPage } from './pages/ChatPage';
import { BiddingManagementPage } from './pages/BiddingManagementPage';
import { BiddingSettingsPage } from './pages/BiddingSettingsPage';
import { FurniturePage } from './pages/FurniturePage';
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
              <Route path="/contractors" element={<ContractorsPage />} />
              <Route path="/regions" element={<RegionsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/bids" element={<BidsPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/fees" element={<FeesPage />} />
              <Route path="/disputes" element={<DisputesPage />} />
              <Route path="/notification-templates" element={<NotificationTemplatesPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/bidding" element={<BiddingManagementPage />} />
              <Route path="/bidding-settings" element={<BiddingSettingsPage />} />
              <Route path="/furniture" element={<FurniturePage />} />
              <Route path="/pricing-config" element={<PricingConfigPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/preview" element={<LivePreviewPage />} />
              <Route path="/blog-manager" element={<BlogManagerPage />} />
              <Route path="/users" element={<UsersPage />} />
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
