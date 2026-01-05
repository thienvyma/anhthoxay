import { tokens } from '../../../../theme';
import { Button } from '../../../components/Button';

export interface BulkDeleteModalProps {
  isOpen: boolean;
  selectedCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDeleteModal({
  isOpen,
  selectedCount,
  isDeleting,
  onConfirm,
  onCancel,
}: BulkDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: tokens.color.overlay,
          zIndex: 9998,
        }} 
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: tokens.color.surface,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: 12,
        padding: 24,
        maxWidth: 400,
        width: '90%',
        zIndex: 9999,
      }}>
        <h3 style={{ color: tokens.color.text, margin: '0 0 16px', fontSize: 18 }}>
          <i className="ri-error-warning-line" style={{ color: tokens.color.error, marginRight: 8 }} />
          Xác nhận xóa hàng loạt
        </h3>
        <p style={{ color: tokens.color.muted, marginBottom: 20 }}>
          Bạn có chắc muốn xóa <strong style={{ color: tokens.color.error }}>{selectedCount}</strong> khách hàng? 
          Hành động này không thể hoàn tác.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ background: tokens.color.error }}
          >
            {isDeleting ? (
              <><i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} /> Đang xóa...</>
            ) : (
              <><i className="ri-delete-bin-line" /> Xóa {selectedCount} leads</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
