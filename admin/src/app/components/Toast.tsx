import { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../../theme';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => addToast('success', message, duration), [addToast]);
  const error = useCallback((message: string, duration?: number) => addToast('error', message, duration), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast('warning', message, duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast('info', message, duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast icons and colors - Light mode
const toastConfig: Record<ToastType, { icon: string; bg: string; border: string; iconColor: string }> = {
  success: {
    icon: 'ri-checkbox-circle-fill',
    bg: '#ECFDF5',
    border: '#10b981',
    iconColor: '#10b981',
  },
  error: {
    icon: 'ri-error-warning-fill',
    bg: '#FEF2F2',
    border: tokens.color.error,
    iconColor: tokens.color.error,
  },
  warning: {
    icon: 'ri-alert-fill',
    bg: '#FFFBEB',
    border: '#f59e0b',
    iconColor: '#f59e0b',
  },
  info: {
    icon: 'ri-information-fill',
    bg: '#EFF6FF',
    border: '#3b82f6',
    iconColor: '#3b82f6',
  },
};

// Single Toast Item - Center popup style
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const config = toastConfig[toast.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        background: tokens.color.surface,
        border: `2px solid ${config.border}`,
        borderRadius: '20px',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minWidth: '320px',
        maxWidth: '500px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background pulse */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: 20,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${config.iconColor}40 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <i className={config.icon} style={{ fontSize: 28, color: config.iconColor, filter: 'drop-shadow(0 2px 8px currentColor)' }} />
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{ flex: 1, position: 'relative', zIndex: 1 }}
      >
        <span style={{
          fontWeight: 600,
          color: tokens.color.text,
          fontSize: 14,
          lineHeight: 1.4,
        }}>
          {toast.message}
        </span>
      </motion.div>

      {/* Close button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        style={{
          background: tokens.color.surfaceHover,
          border: 'none',
          borderRadius: '50%',
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: tokens.color.muted,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <i className="ri-close-line" style={{ fontSize: 16 }} />
      </motion.button>
    </motion.div>
  );
}

// Toast Container - Center top of screen
export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onRemove={() => onRemove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
