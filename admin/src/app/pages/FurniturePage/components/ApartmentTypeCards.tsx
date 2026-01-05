/**
 * ApartmentTypeCards - Display apartment types for a building
 * Feature: furniture-quotation
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '../../../../theme';
import { ResponsiveGrid } from '../../../../components/responsive';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import type { FurnitureBuilding, FurnitureApartmentType } from '../types';

interface ApartmentTypeCardsProps {
  building: FurnitureBuilding;
  apartmentTypes: FurnitureApartmentType[];
  onAdd: () => void;
  onEdit: (apt: FurnitureApartmentType) => void;
  onDelete: (id: string) => void;
}

export const ApartmentTypeCards = memo(function ApartmentTypeCards({
  building,
  apartmentTypes,
  onAdd,
  onEdit,
  onDelete,
}: ApartmentTypeCardsProps) {
  if (apartmentTypes.length === 0) {
    return (
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
            Loại căn hộ - {building.code}
          </h4>
          <Button variant="outline" size="small" onClick={onAdd}>
            <i className="ri-add-line" /> Thêm loại căn hộ
          </Button>
        </div>
        <div style={{ textAlign: 'center', padding: 32, color: tokens.color.muted }}>
          <i className="ri-home-line" style={{ fontSize: 40, opacity: 0.3, display: 'block', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Chưa có loại căn hộ nào</p>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 16, fontWeight: 600 }}>
          Loại căn hộ - {building.code}
        </h4>
        <Button variant="outline" size="small" onClick={onAdd}>
          <i className="ri-add-line" /> Thêm loại căn hộ
        </Button>
      </div>

      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={16}>
        {apartmentTypes.map((apt) => (
          <motion.div
            key={apt.id}
            whileHover={{ y: -4 }}
            style={{
              background: tokens.color.surfaceHover,
              borderRadius: 12,
              overflow: 'hidden',
              border: `1px solid ${tokens.color.border}`,
            }}
          >
            {apt.imageUrl && (
              <div
                style={{
                  width: '100%',
                  height: 160,
                  backgroundImage: `url(${apt.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h5
                    style={{
                      color: tokens.color.text,
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {apt.apartmentType}
                  </h5>
                  <span style={{ color: tokens.color.muted, fontSize: 12 }}>{apt.buildingCode}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button variant="ghost" size="small" onClick={() => onEdit(apt)}>
                    <i className="ri-edit-line" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => onDelete(apt.id)}
                    style={{ color: tokens.color.error }}
                  >
                    <i className="ri-delete-bin-line" />
                  </Button>
                </div>
              </div>
              {apt.description && (
                <p
                  style={{
                    color: tokens.color.muted,
                    fontSize: 13,
                    margin: '8px 0 0',
                    lineHeight: 1.5,
                  }}
                >
                  {apt.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </ResponsiveGrid>
    </Card>
  );
});

export default ApartmentTypeCards;
