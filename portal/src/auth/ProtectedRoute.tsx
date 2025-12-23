import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from './AuthContext';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Debug log
  console.log('[ProtectedRoute] Check:', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    user: user ? { id: user.id, role: user.role, name: user.name } : null,
    allowedRoles,
    roleIncluded: user && allowedRoles ? allowedRoles.includes(user.role) : 'N/A',
  });

  // Show loading spinner while checking auth
  if (isLoading) {
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role if allowedRoles is specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'HOMEOWNER') {
      return <Navigate to="/homeowner" replace />;
    } else if (user.role === 'CONTRACTOR') {
      return <Navigate to="/contractor" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
