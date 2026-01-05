/**
 * Dispute Table Component
 *
 * Displays disputes in a table format with status badges and actions.
 *
 * **Feature: bidding-phase3-matching**
 * **Requirements: 16.3**
 */

import { motion } from 'framer-motion';
import { tokens } from '../../../theme';
import { Button } from '../../components/Button';
import {
  DISPUTE_STATUS_COLORS,
  DISPUTE_STATUS_LABELS,
  type DisputeListItem,
  type DisputeStatus,
} from './types';

interface DisputeTableProps {
  disputes: DisputeListItem[];
  loading: boolean;
  onViewDetail: (dispute: DisputeListItem) => void;
  onResolve: (dispute: DisputeListItem) => void;
}

export function DisputeTable({ disputes, loading, onViewDetail, onResolve }: DisputeTableProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: 48,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${tokens.color.border}`,
            borderTopColor: tokens.color.primary,
          }}
        />
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: tokens.color.muted,
        }}
      >
        <i className="ri-error-warning-line" style={{ fontSize: 48, marginBottom: 16, display: 'block' }} />
        <p>Không có tranh chấp nào</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
            <th
              style={{
                padding: '16px',
                textAlign: 'left',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Công trình
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'left',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Người tạo
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'left',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Lý do
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'center',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Trạng thái
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'center',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Ngày tạo
            </th>
            <th
              style={{
                padding: '16px',
                textAlign: 'center',
                color: tokens.color.muted,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((dispute) => {
            const statusColor = DISPUTE_STATUS_COLORS[dispute.status as DisputeStatus];
            const statusLabel = DISPUTE_STATUS_LABELS[dispute.status as DisputeStatus];
            const roleLabel = dispute.raisedBy.role === 'HOMEOWNER' ? 'Chủ nhà' : 'Nhà thầu';

            return (
              <motion.tr
                key={dispute.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  borderBottom: `1px solid ${tokens.color.border}`,
                  cursor: 'pointer',
                }}
                whileHover={{ background: tokens.color.surfaceHover }}
                onClick={() => onViewDetail(dispute)}
              >
                {/* Project */}
                <td style={{ padding: '16px' }}>
                  <div>
                    <div style={{ color: tokens.color.text, fontWeight: 500 }}>
                      {dispute.project.code}
                    </div>
                    <div
                      style={{
                        color: tokens.color.muted,
                        fontSize: 13,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {dispute.project.title}
                    </div>
                  </div>
                </td>

                {/* Raised By */}
                <td style={{ padding: '16px' }}>
                  <div>
                    <div style={{ color: tokens.color.text, fontWeight: 500 }}>
                      {dispute.raisedBy.name}
                    </div>
                    <div
                      style={{
                        color: tokens.color.muted,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i
                        className={
                          dispute.raisedBy.role === 'HOMEOWNER'
                            ? 'ri-home-4-line'
                            : 'ri-building-2-line'
                        }
                      />
                      {roleLabel}
                    </div>
                  </div>
                </td>

                {/* Reason */}
                <td style={{ padding: '16px' }}>
                  <div
                    style={{
                      color: tokens.color.text,
                      fontSize: 14,
                      maxWidth: 250,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={dispute.reason}
                  >
                    {dispute.reason}
                  </div>
                </td>

                {/* Status */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: tokens.radius.sm,
                      background: `${statusColor}20`,
                      color: statusColor,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {statusLabel}
                  </span>
                </td>

                {/* Created At */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ color: tokens.color.muted, fontSize: 13 }}>
                    {new Date(dispute.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </td>

                {/* Actions */}
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <div
                    style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onViewDetail(dispute)}
                    >
                      <i className="ri-eye-line" />
                    </Button>
                    {dispute.status === 'OPEN' && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => onResolve(dispute)}
                      >
                        <i className="ri-check-double-line" />
                      </Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
