/**
 * MetricsGrid - Building floor/axis grid for apartment type mapping
 * Feature: furniture-quotation
 */

import { memo, useMemo } from 'react';
import { tokens } from '@app/shared';
import { Card } from '../../../components/Card';
import type { FurnitureBuilding, FurnitureLayout, MetricsGridCell } from '../types';

interface MetricsGridProps {
  building: FurnitureBuilding;
  layouts: FurnitureLayout[];
  onCellClick: (cell: MetricsGridCell) => void;
}

export const MetricsGrid = memo(function MetricsGrid({ building, layouts, onCellClick }: MetricsGridProps) {
  const grid = useMemo(() => {
    const result: MetricsGridCell[][] = [];
    for (let floor = building.maxFloor; floor >= 1; floor--) {
      const row: MetricsGridCell[] = [];
      for (let axis = 0; axis <= building.maxAxis; axis++) {
        const layout = layouts.find((l) => l.buildingCode === building.code && l.axis === axis);
        row.push({
          floor,
          axis,
          apartmentType: layout?.apartmentType || null,
          layoutId: layout?.id || null,
        });
      }
      result.push(row);
    }
    return result;
  }, [building, layouts]);

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
          Sơ đồ căn hộ - {building.name} ({building.code})
        </h4>
        <span style={{ color: tokens.color.muted, fontSize: 13 }}>
          {building.maxFloor} tầng × {building.maxAxis + 1} trục
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: (building.maxAxis + 2) * 80,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '8px 12px',
                  background: tokens.color.surfaceHover,
                  color: tokens.color.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  border: `1px solid ${tokens.color.border}`,
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                }}
              >
                Tầng
              </th>
              {Array.from({ length: building.maxAxis + 1 }, (_, i) => (
                <th
                  key={i}
                  style={{
                    padding: '8px 12px',
                    background: tokens.color.surfaceHover,
                    color: tokens.color.muted,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                    border: `1px solid ${tokens.color.border}`,
                    minWidth: 70,
                  }}
                >
                  Trục {i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  style={{
                    padding: '8px 12px',
                    background: tokens.color.surfaceHover,
                    color: tokens.color.text,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                    border: `1px solid ${tokens.color.border}`,
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                  }}
                >
                  {row[0]?.floor}
                </td>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    onClick={() => onCellClick(cell)}
                    style={{
                      padding: '8px 12px',
                      background: cell.apartmentType ? `${tokens.color.primary}15` : 'transparent',
                      color: cell.apartmentType ? tokens.color.primary : tokens.color.muted,
                      fontSize: 12,
                      textAlign: 'center',
                      border: `1px solid ${tokens.color.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = tokens.color.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = cell.apartmentType
                        ? `${tokens.color.primary}15`
                        : 'transparent';
                    }}
                  >
                    {cell.apartmentType || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ color: tokens.color.muted, fontSize: 12, marginTop: 12, marginBottom: 0 }}>
        <i className="ri-information-line" style={{ marginRight: 4 }} />
        Click vào ô để chỉnh sửa loại căn hộ cho trục đó
      </p>
    </Card>
  );
});

export default MetricsGrid;
