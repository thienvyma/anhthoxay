import type { CustomerLead, StatusHistoryEntry } from '../../types';

// Re-export for convenience
export type { CustomerLead, StatusHistoryEntry };

// Furniture Quotation type
export interface FurnitureQuotation {
  id: string;
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string;
  apartmentType: string;
  layoutImageUrl: string | null;
  items: string;
  basePrice: number;
  fees: string;
  totalPrice: number;
  createdAt: string;
}

// Component Props
export interface QuoteDataDisplayProps {
  quoteData: string | null;
}

export interface NotesEditorProps {
  initialNotes: string | null;
  onSave: (notes: string) => Promise<void>;
}

export interface StatusHistoryProps {
  history: string | null;
}

export interface FurnitureQuotationHistoryProps {
  quotations: FurnitureQuotation[];
  loading: boolean;
}

export interface LeadDetailModalProps {
  lead: CustomerLead | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onNotesChange: (id: string, notes: string) => Promise<void>;
  furnitureQuotations: FurnitureQuotation[];
  loadingQuotations: boolean;
}

// Status colors and labels
export const statusColors: Record<string, { bg: string; text: string }> = {
  NEW: { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
  CONTACTED: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
  CONVERTED: { bg: 'rgba(16,185,129,0.2)', text: '#10b981' },
  CANCELLED: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
};

export const statusLabels: Record<string, string> = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  CONVERTED: 'Đã chuyển đổi',
  CANCELLED: 'Đã hủy',
};

// Source colors and labels
export const sourceColors: Record<string, { bg: string; text: string; icon: string }> = {
  FURNITURE_QUOTE: { bg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6', icon: 'ri-sofa-line' },
  QUOTE_FORM: { bg: 'rgba(245, 211, 147, 0.2)', text: '#F5D393', icon: 'ri-calculator-line' },
  CONTACT_FORM: { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', icon: 'ri-mail-line' },
};

export const sourceLabels: Record<string, string> = {
  FURNITURE_QUOTE: 'Nội thất',
  QUOTE_FORM: 'Báo giá',
  CONTACT_FORM: 'Liên hệ',
};
