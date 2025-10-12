import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { PagesPage } from './pages/PagesPage';
import { SectionsPage } from './pages/SectionsPage';
import { MenuPage } from './pages/MenuPage';
import { MediaPage } from './pages/MediaPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { LivePreviewPage } from './pages/LivePreviewPage';
import { BlogCategoriesPage } from './pages/BlogCategoriesPage';
import { BlogPostsPage } from './pages/BlogPostsPage';
import { SpecialOffersPage } from './pages/SpecialOffersPage';
import { SettingsPage } from './pages/SettingsPage';
import { useUser, store } from './store';
import { authApi } from './api';
import type { RouteType } from './types';

// App Content Component (uses router hooks)
function AppContent() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

	useEffect(() => {
    // Check if user is already logged in
    authApi
      .me()
      .then((userData) => {
        store.setUser(userData as any);
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => {
        setLoading(false);
		});
	}, []);

  async function handleLogout() {
    try {
      await authApi.logout();
      store.setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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
            <Route path="/pages" element={<PagesPage onNavigateToSections={(slug) => navigate(`/sections/${slug}`)} />} />
            <Route path="/sections/:slug" element={<SectionsPageWrapper />} />
            <Route path="/sections" element={<Navigate to="/sections/home" replace />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/media" element={<MediaPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/preview" element={<LivePreviewPage />} />
            <Route path="/offers" element={<SpecialOffersPage />} />
            <Route path="/blog-categories" element={<BlogCategoriesPage />} />
            <Route path="/blog-posts" element={<BlogPostsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
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
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
