import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { ToastProvider } from '../components/Toast';
import { NetworkStatusProvider } from '../components/OfflineIndicator';
import { ThemeProvider } from '../contexts/ThemeContext';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Public pages
import { PublicMarketplacePage } from '../pages/public/MarketplacePage';
import { ContractorDirectoryPage } from '../pages/public/ContractorDirectoryPage';

// Homeowner pages
import { HomeownerDashboard } from '../pages/homeowner/DashboardPage';
import { ProjectsPage } from '../pages/homeowner/ProjectsPage';
import { ProjectDetailPage } from '../pages/homeowner/ProjectDetailPage';
import { CreateProjectPage } from '../pages/homeowner/CreateProjectPage';
import { HomeownerProfilePage } from '../pages/homeowner/ProfilePage';

// Contractor pages
import { ContractorDashboard } from '../pages/contractor/DashboardPage';
import { ContractorMarketplacePage } from '../pages/contractor/MarketplacePage';
import { MyBidsPage } from '../pages/contractor/MyBidsPage';
import { BidDetailPage } from '../pages/contractor/BidDetailPage';
import { CreateBidPage } from '../pages/contractor/CreateBidPage';
import { SavedProjectsPage } from '../pages/contractor/SavedProjectsPage';
import { ProfilePage as ContractorProfilePage } from '../pages/contractor/ProfilePage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <NetworkStatusProvider>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicMarketplacePage />} />
              <Route path="/marketplace" element={<PublicMarketplacePage />} />
              <Route path="/contractors" element={<ContractorDirectoryPage />} />
              
              {/* Auth routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              
              {/* Homeowner routes (protected) */}
              <Route
                path="/homeowner/*"
                element={
                  <ProtectedRoute allowedRoles={['HOMEOWNER', 'ADMIN']}>
                    <Routes>
                      <Route path="/" element={<HomeownerDashboard />} />
                      <Route path="/dashboard" element={<HomeownerDashboard />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/new" element={<CreateProjectPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      <Route path="/profile" element={<HomeownerProfilePage />} />
                      <Route path="*" element={<Navigate to="/homeowner" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
              
              {/* Contractor routes (protected) */}
              <Route
                path="/contractor/*"
                element={
                  <ProtectedRoute allowedRoles={['CONTRACTOR', 'ADMIN']}>
                    <Routes>
                      <Route path="/" element={<ContractorDashboard />} />
                      <Route path="/dashboard" element={<ContractorDashboard />} />
                      <Route path="/marketplace" element={<ContractorMarketplacePage />} />
                      <Route path="/marketplace/:id" element={<ContractorMarketplacePage />} />
                      <Route path="/marketplace/:id/bid" element={<CreateBidPage />} />
                      <Route path="/my-bids" element={<MyBidsPage />} />
                      <Route path="/my-bids/:id" element={<BidDetailPage />} />
                      <Route path="/saved-projects" element={<SavedProjectsPage />} />
                      <Route path="/profile" element={<ContractorProfilePage />} />
                      <Route path="*" element={<Navigate to="/contractor" replace />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
              </NetworkStatusProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
