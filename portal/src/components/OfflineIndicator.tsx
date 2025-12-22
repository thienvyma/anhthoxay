/**
 * OfflineIndicator component for network status detection
 * Requirements: 18.3 - Display offline indicator when network is offline
 */

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  wasOffline: false,
});

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        // Hide reconnected message after 3 seconds
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, wasOffline }}>
      {children}
      
      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10000,
              background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
            }}
          >
            <i
              className="ri-wifi-off-line"
              style={{ fontSize: 20, color: 'white' }}
            />
            <span
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Không có kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnected Banner */}
      <AnimatePresence>
        {showReconnected && isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10000,
              background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(34, 197, 94, 0.3)',
            }}
          >
            <i
              className="ri-wifi-line"
              style={{ fontSize: 20, color: 'white' }}
            />
            <span
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Đã kết nối lại mạng!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </NetworkStatusContext.Provider>
  );
}

// Standalone offline indicator component (for use without provider)
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: '#1a1a1f',
        border: '1px solid #ef4444',
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#ef4444',
          animation: 'pulse 2s infinite',
        }}
      />
      <i
        className="ri-wifi-off-line"
        style={{ fontSize: 18, color: '#ef4444' }}
      />
      <span style={{ color: '#e4e7ec', fontSize: 14 }}>
        Mất kết nối mạng
      </span>
    </div>
  );
}

// Small inline indicator
export function NetworkStatusBadge() {
  const { isOnline } = useNetworkStatus();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 9999,
        background: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        fontSize: 12,
        fontWeight: 500,
        color: isOnline ? '#22c55e' : '#ef4444',
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isOnline ? '#22c55e' : '#ef4444',
        }}
      />
      {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
    </div>
  );
}
