import { tokens } from '@app/shared';
import { Button } from '../../../components/Button';
import { ResponsiveModal } from '../../../../components/responsive/ResponsiveModal';
import { ResponsiveGrid } from '../../../../components/responsive/ResponsiveGrid';
import { QuoteDataDisplay } from './QuoteDataDisplay';
import { NotesEditor } from './NotesEditor';
import { StatusHistory } from './StatusHistory';
import { FurnitureQuotationHistory } from './FurnitureQuotationHistory';
import { statusLabels } from '../types';
import type { LeadDetailModalProps } from '../types';

/**
 * LeadDetailModal - Modal displaying full lead details with editing capabilities
 */
export function LeadDetailModal({
  lead,
  onClose,
  onStatusChange,
  onNotesChange,
  furnitureQuotations,
  loadingQuotations,
}: LeadDetailModalProps) {
  if (!lead) return null;

  return (
    <ResponsiveModal
      isOpen={!!lead}
      onClose={onClose}
      title="Chi tiết khách hàng"
      size="lg"
    >
      <div style={{ display: 'grid', gap: 20 }}>
        {/* Basic Info */}
        <ResponsiveGrid
          cols={{ mobile: 1, tablet: 2, desktop: 2 }}
          gap={16}
        >
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13 }}>Họ tên</label>
            <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>{lead.name}</div>
          </div>
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13 }}>Số điện thoại</label>
            <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>
              <a href={`tel:${lead.phone}`} style={{ color: tokens.color.primary }}>
                {lead.phone}
              </a>
            </div>
          </div>
          {lead.email && (
            <div>
              <label style={{ color: tokens.color.muted, fontSize: 13 }}>Email</label>
              <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>
                <a href={`mailto:${lead.email}`} style={{ color: tokens.color.primary }}>
                  {lead.email}
                </a>
              </div>
            </div>
          )}
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13 }}>Nguồn</label>
            <div style={{ color: tokens.color.text, fontSize: 16, marginTop: 4 }}>{lead.source}</div>
          </div>
        </ResponsiveGrid>

        {/* Content */}
        <div>
          <label style={{ color: tokens.color.muted, fontSize: 13 }}>Nội dung yêu cầu</label>
          <div style={{ 
            color: tokens.color.text, 
            fontSize: 14, 
            marginTop: 4, 
            whiteSpace: 'pre-wrap',
            padding: 12,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 8,
          }}>
            {lead.content}
          </div>
        </div>

        {/* Quote Data */}
        {lead.quoteData && (
          <div>
            <label style={{ color: tokens.color.muted, fontSize: 13 }}>Dữ liệu báo giá</label>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 12,
              borderRadius: 8,
              marginTop: 4,
            }}>
              <QuoteDataDisplay quoteData={lead.quoteData} />
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
            Ghi chú nội bộ
          </label>
          <NotesEditor
            initialNotes={lead.notes}
            onSave={(notes) => onNotesChange(lead.id, notes)}
          />
        </div>

        {/* Status */}
        <div>
          <label style={{ color: tokens.color.muted, fontSize: 13, marginBottom: 8, display: 'block' }}>
            Cập nhật trạng thái
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(statusLabels).map(([status, label]) => (
              <Button
                key={status}
                variant={lead.status === status ? 'primary' : 'outline'}
                size="small"
                onClick={() => onStatusChange(lead.id, status)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Status History */}
        <StatusHistory history={lead.statusHistory} />
        
        {/* Furniture Quotation History */}
        <FurnitureQuotationHistory 
          quotations={furnitureQuotations} 
          loading={loadingQuotations} 
        />
      </div>
    </ResponsiveModal>
  );
}
