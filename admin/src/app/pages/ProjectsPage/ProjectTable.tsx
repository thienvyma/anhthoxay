/**
 * Project Table Component
 *
 * Displays list of projects in a table format.
 *
 * **Feature: bidding-phase2-core**
 * **Requirements: 10.1, 10.6**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import type { ProjectListItem, ProjectStatus } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './types';

interface ProjectTableProps {
  projects: ProjectListItem[];
  loading: boolean;
  onViewDetail: (project: ProjectListItem) => void;
  onApprove: (project: ProjectListItem) => void;
  onReject: (project: ProjectListItem) => void;
}

export const ProjectTable = memo(function ProjectTable({
  projects,
  loading,
  onViewDetail,
  onApprove,
  onReject,
}: ProjectTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <motion.i
          className="ri-loader-4-line"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32 }}
        />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: tokens.color.muted }}>
        <i className="ri-building-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
        <p>Không tìm thấy công trình nào</p>
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
          <th style={thStyle}>Mã</th>
          <th style={thStyle}>Tiêu đề</th>
          <th style={thStyle}>Chủ nhà</th>
          <th style={thStyle}>Khu vực</th>
          <th style={thStyle}>Danh mục</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Trạng thái</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Bids</th>
          <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onViewDetail={onViewDetail}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </tbody>
    </table>
  );
});

// Table row component
const ProjectRow = memo(function ProjectRow({
  project,
  onViewDetail,
  onApprove,
  onReject,
}: {
  project: ProjectListItem;
  onViewDetail: (project: ProjectListItem) => void;
  onApprove: (project: ProjectListItem) => void;
  onReject: (project: ProjectListItem) => void;
}) {
  const canApprove = project.status === 'PENDING_APPROVAL';

  return (
    <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 13,
            color: tokens.color.primary,
            fontWeight: 500,
          }}
        >
          {project.code}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text, fontWeight: 500 }}>{project.title}</div>
        {project.bidDeadline && (
          <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 2 }}>
            <i className="ri-time-line" style={{ marginRight: 4 }} />
            Hạn: {new Date(project.bidDeadline).toLocaleDateString('vi-VN')}
          </div>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ color: tokens.color.text }}>{project.owner.name}</div>
        <div style={{ color: tokens.color.muted, fontSize: 12 }}>{project.owner.email}</div>
      </td>
      <td style={{ padding: '12px 16px', color: tokens.color.muted }}>
        {project.region.name}
      </td>
      <td style={{ padding: '12px 16px', color: tokens.color.muted }}>
        {project.category.name}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <StatusBadge status={project.status} />
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: tokens.radius.sm,
            background: project.bidCount > 0 ? `${tokens.color.primary}20` : 'rgba(255,255,255,0.05)',
            color: project.bidCount > 0 ? tokens.color.primary : tokens.color.muted,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {project.bidCount}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <ActionButton
            icon="ri-eye-line"
            title="Xem chi tiết"
            onClick={() => onViewDetail(project)}
            color={tokens.color.primary}
          />
          {canApprove && (
            <>
              <ActionButton
                icon="ri-check-line"
                title="Duyệt"
                onClick={() => onApprove(project)}
                color="#10B981"
                bgColor="rgba(16, 185, 129, 0.1)"
                borderColor="rgba(16, 185, 129, 0.3)"
              />
              <ActionButton
                icon="ri-close-line"
                title="Từ chối"
                onClick={() => onReject(project)}
                color="#EF4444"
                bgColor="rgba(239, 68, 68, 0.1)"
                borderColor="rgba(239, 68, 68, 0.3)"
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

// Status badge component
function StatusBadge({ status }: { status: ProjectStatus }) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: tokens.radius.sm,
        background: `${color}20`,
        color: color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// Action button component
function ActionButton({
  icon,
  title,
  onClick,
  color,
  bgColor = 'rgba(255,255,255,0.05)',
  borderColor = tokens.color.border,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  color: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={title}
      style={{
        padding: 8,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: tokens.radius.sm,
        color,
        cursor: 'pointer',
      }}
    >
      <i className={icon} />
    </motion.button>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  color: tokens.color.muted,
  fontSize: 13,
  fontWeight: 500,
};
