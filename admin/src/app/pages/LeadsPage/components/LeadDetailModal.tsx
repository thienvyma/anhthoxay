import { useState } from 'react';
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
  onDelete,
  furnitureQuotations,
  loadingQuotations,
}: LeadDetailModalProps & { onDelete?: (id: string) => Promise<void> }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (!lead) return null;

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(lead.id);
      onClose();
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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

        {/* Delete Section */}
        {onDelete && (
          <div style={{ 
            borderTop: `1px solid ${tokens.color.border}`, 
            paddingTop: 16, 
            marginTop: 8 
          }}>
            {!showDeleteConfirm ? (
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                style={{ color: tokens.color.error, borderColor: tokens.color.error }}
              >
                <i className="ri-delete-bin-line" /> Xóa khách hàng
              </Button>
            ) : (
              <div style={{ 
                padding: 16, 
                background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: 8,
                border: `1px solid ${tokens.color.error}` 
              }}>
                <p style={{ color: tokens.color.text, marginBottom: 12 }}>
                  Bạn có chắc muốn xóa khách hàng <strong>{lead.name}</strong>? Hành động này không thể hoàn tác.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="primary"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ background: tokens.color.error }}
                  >
                    {deleting ? (
                      <><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> Đang xóa...</>
                    ) : (
                      <><i className="ri-delete-bin-line" /> Xác nhận xóa</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}
