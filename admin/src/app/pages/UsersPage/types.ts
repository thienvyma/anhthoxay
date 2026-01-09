/**
 * UsersPage Type Definitions
 * Requirements: 2.6
 */

import type { UserAccount, UserSession } from '../../types';

// Re-export for convenience
export type { UserAccount, UserSession };

// User role type
export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTRACTOR' | 'HOMEOWNER' | 'WORKER' | 'USER';

// Role colors for badges
export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: '#EF4444',
  MANAGER: '#F59E0B',
  CONTRACTOR: '#8B5CF6',
  HOMEOWNER: '#06B6D4',
  WORKER: '#3B82F6',
  USER: '#10B981',
};

// Role labels in Vietnamese
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Quản lý',
  CONTRACTOR: 'Nhà thầu',
  HOMEOWNER: 'Chủ nhà',
  WORKER: 'Thợ',
  USER: 'Người dùng',
};

// Form data for create/edit user
export interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// Component Props
export interface UserTableProps {
  users: UserAccount[];
  loading: boolean;
  onEdit: (user: UserAccount) => void;
  onDelete: (user: UserAccount) => void;
  onBan: (user: UserAccount) => void;
  onViewSessions: (user: UserAccount) => void;
}

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  isMobile: boolean;
}

export interface EditUserModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  saving: boolean;
  isMobile: boolean;
}

export interface SessionsModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  sessions: UserSession[];
  onClose: () => void;
  onRevokeSession: (sessionId: string) => void;
  isMobile: boolean;
}
