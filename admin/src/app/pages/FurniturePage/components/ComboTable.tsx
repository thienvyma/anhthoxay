/**
 * ComboTable - Combo table component for ComboTab
 *
 * Feature: furniture-quotation
 * Requirements: 6.4
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { ResponsiveTable, TableColumn } from '../../../../components/responsive';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { FurnitureCombo } from '../types';

export interface ComboTableProps {
  combos: FurnitureCombo[];
  loading: boolean;
  onAddCombo: () => void;
  onEditCombo: (combo: FurnitureCombo) => void;
  onDeleteCombo: (comboId: string) => void;
  onDuplicateCombo: (comboId: string) => void;
  onToggleStatus: (combo: FurnitureCombo) => void;
  onRefresh: () => void;
}

export function ComboTable({
  combos,
  loading,
  onAddCombo,
  onEditCombo,
  onDeleteCombo,
  onDuplicateCombo,
  onToggleStatus,
  onRefresh,
}: ComboTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const parseApartmentTypes = (apartmentTypesJson: string): string[] => {
    try {
      return JSON.parse(apartmentTypesJson);
    } catch {
      return [];
    }
  };

  const columns: TableColumn<FurnitureCombo>[] = useMemo(
    () => [
      {
        key: 'name' as keyof FurnitureCombo,
        header: 'Tên Combo',
        priority: 1,
        render: (_, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: row.imageUrl
                  ? `url(${row.imageUrl}) center/cover`
                  : `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {!row.imageUrl && (
                <i className="ri-gift-line" style={{ fontSize: 20, color: '#0b0c0f' }} />
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: tokens.color.text }}>{row.name}</div>
              {row.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: tokens.color.muted,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.description}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'apartmentTypes' as keyof FurnitureCombo,
        header: 'Loại căn hộ',
        priority: 2,
        hideOnMobile: true,
        render: (value) => {
          const types = parseApartmentTypes(value as string);
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {types.map((type) => (
                <span
                  key={type}
                  style={{
                    background: `${tokens.color.primary}20`,
                    color: tokens.color.primary,
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {type.toUpperCase()}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        key: 'price' as keyof FurnitureCombo,
        header: 'Giá',
        priority: 3,
        align: 'right',
        render: (value) => (
          <span style={{ fontWeight: 600, color: tokens.color.primary }}>
            {formatPrice(value as number)}
          </span>
        ),
      },
      {
        key: 'isActive' as keyof FurnitureCombo,
        header: 'Trạng thái',
        priority: 4,
        align: 'center',
        render: (value, row) => (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(row);
            }}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 16,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: value
                ? `${tokens.color.success}20`
                : `${tokens.color.muted}20`,
              color: value ? tokens.color.success : tokens.color.muted,
              fontSize: 12,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            <i className={value ? 'ri-eye-line' : 'ri-eye-off-line'} />
            {value ? 'Hiển thị' : 'Đã ẩn'}
          </motion.button>
        ),
      },
    ],
    [loading, onToggleStatus]
  );

  return (
    <>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <h3 style={{ color: tokens.color.text, margin: 0, fontSize: 20, fontWeight: 600 }}>
          Quản lý Combo Nội thất
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={onRefresh} disabled={loading} variant="outline">
            <i className="ri-refresh-line" /> Làm mới
          </Button>
          <Button onClick={onAddCombo} disabled={loading}>
            <i className="ri-add-line" /> Thêm Combo
          </Button>
        </div>
      </div>

      {/* Combo Table */}
      <Card>
        <ResponsiveTable
          data={combos}
          columns={columns}
          loading={loading}
          emptyMessage="Chưa có combo nào. Nhấn 'Thêm Combo' để tạo mới."
          getRowKey={(row) => row.id}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="ghost"
                size="small"
                onClick={() => onDuplicateCombo(row.id)}
                disabled={loading}
              >
                <i className="ri-file-copy-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => onEditCombo(row)}
                disabled={loading}
              >
                <i className="ri-edit-line" />
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={() => onDeleteCombo(row.id)}
                disabled={loading}
                style={{ color: tokens.color.error }}
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          )}
        />
      </Card>
    </>
  );
}

export default ComboTable;
