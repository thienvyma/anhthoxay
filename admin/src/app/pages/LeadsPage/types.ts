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
  selectionType: 'COMBO' | 'CUSTOM';
  comboId: string | null;
  comboName: string | null;
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
