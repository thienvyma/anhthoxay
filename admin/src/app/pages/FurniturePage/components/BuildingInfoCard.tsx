/**
 * BuildingInfoCard - Display selected building info
 * Feature: furniture-quotation
 */

import { memo } from 'react';
import { tokens } from '@app/shared';
import { Card } from '../../../components/Card';
import type { FurnitureDeveloper, FurnitureProject, FurnitureBuilding } from '../types';

interface BuildingInfoCardProps {
  building: FurnitureBuilding;
  developer?: FurnitureDeveloper;
  project?: FurnitureProject;
  apartmentTypesCount: number;
}

export const BuildingInfoCard = memo(function BuildingInfoCard({
  building,
  developer,
  project,
  apartmentTypesCount,
}: BuildingInfoCardProps) {
  return (
    <Card
      style={{
        marginBottom: 24,
        background: `${tokens.color.primary}08`,
        border: `1px solid ${tokens.color.primary}40`,
      }}
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {building.imageUrl && (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: tokens.radius.md,
              backgroundImage: `url(${building.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h4 style={{ color: tokens.color.text, margin: 0, fontSize: 18, fontWeight: 600 }}>{building.name}</h4>
          <p style={{ color: tokens.color.muted, margin: '4px 0 0', fontSize: 13 }}>
            {developer?.name} → {project?.name} → {building.code}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: tokens.color.primary }}>{building.maxFloor}</div>
            <div style={{ fontSize: 12, color: tokens.color.muted }}>Tầng</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: tokens.color.primary }}>{building.maxAxis + 1}</div>
            <div style={{ fontSize: 12, color: tokens.color.muted }}>Trục</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: tokens.color.primary }}>{apartmentTypesCount}</div>
            <div style={{ fontSize: 12, color: tokens.color.muted }}>Loại căn</div>
          </div>
        </div>
      </div>
    </Card>
  );
});

export default BuildingInfoCard;
