/**
 * PackageComparison - Side-by-side package comparison modal
 *
 * **Feature: interior-quote-module, Property 10**
 * **Validates: Requirements 14.6**
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import type { Package, PackageRoomItems, PackageItem } from '../types';

interface PackageComparisonProps {
  packages: Package[];
  selectedIds: string[];
  onClose: () => void;
  onSelect: (pkg: Package) => void;
}

interface PackageDetail extends Package {
  items: PackageRoomItems[];
}

// Tier labels by number (DB stores tier as 1-4)
const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Cơ bản', color: tokens.color.textMuted },
  2: { label: 'Tiêu chuẩn', color: tokens.color.info },
  3: { label: 'Cao cấp', color: tokens.color.warning },
  4: { label: 'Sang trọng', color: tokens.color.primary },
};

export function PackageComparison({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  packages, // Available for future use (e.g., fallback when API fails)
  selectedIds,
  onClose,
  onSelect,
}: PackageComparisonProps) {
  const [packageDetails, setPackageDetails] = useState<PackageDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed package info with items
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const details = await Promise.all(
          selectedIds.map(async (id) => {
            const response = await fetch(`${API_URL}/api/interior/packages/${id}`);
            if (!response.ok) throw new Error('Failed to fetch package');
            const json = await response.json();
            return json.data || json;
          })
        );

        setPackageDetails(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    if (selectedIds.length > 0) {
      fetchDetails();
    }
  }, [selectedIds]);

  // Get all unique rooms across all packages
  const allRooms = useMemo(() => {
    const roomSet = new Set<string>();
    packageDetails.forEach((pkg) => {
      pkg.items?.forEach((roomItems) => {
        roomSet.add(roomItems.room);
      });
    });
    return Array.from(roomSet);
  }, [packageDetails]);

  // Get items for a specific room in a package
  const getRoomItems = (pkg: PackageDetail, room: string): PackageItem[] => {
    const roomData = pkg.items?.find((r) => r.room === room);
    return roomData?.items || [];
  };

  // Calculate total items for a room
  const getRoomTotal = (items: PackageItem[]): number => {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={modalStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={titleStyle}>So sánh Gói Nội Thất</h2>
            <button onClick={onClose} style={closeButtonStyle}>
              <i className="ri-close-line" />
            </button>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <ComparisonTable
                packages={packageDetails}
                allRooms={allRooms}
                getRoomItems={getRoomItems}
                getRoomTotal={getRoomTotal}
                onSelect={onSelect}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface ComparisonTableProps {
  packages: PackageDetail[];
  allRooms: string[];
  getRoomItems: (pkg: PackageDetail, room: string) => PackageItem[];
  getRoomTotal: (items: PackageItem[]) => number;
  onSelect: (pkg: Package) => void;
}

function ComparisonTable({
  packages,
  allRooms,
  getRoomItems,
  getRoomTotal,
  onSelect,
}: ComparisonTableProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const toggleRoom = (room: string) => {
    setExpandedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(room)) {
        next.delete(room);
      } else {
        next.add(room);
      }
      return next;
    });
  };

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        {/* Header Row - Package Names */}
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '200px' }}>Hạng mục</th>
            {packages.map((pkg) => {
              const tierInfo = TIER_LABELS[pkg.tier] || TIER_LABELS[1];
              return (
                <th key={pkg.id} style={thStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pkg.thumbnail && (
                      <img
                        src={resolveMediaUrl(pkg.thumbnail)}
                        alt={pkg.name}
                        style={thumbnailStyle}
                      />
                    )}
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: `${tierInfo.color}20`,
                        color: tierInfo.color,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        borderRadius: tokens.radius.sm,
                        alignSelf: 'center',
                      }}
                    >
                      {tierInfo.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{pkg.name}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* Price Row */}
          <tr>
            <td style={tdLabelStyle}>
              <i className="ri-money-dollar-circle-line" style={{ marginRight: '0.5rem' }} />
              Giá gói
            </td>
            {packages.map((pkg) => (
              <td key={pkg.id} style={tdValueStyle}>
                <span style={priceStyle}>{pkg.basePrice.toLocaleString('vi-VN')}đ</span>
              </td>
            ))}
          </tr>

          {/* Items Count Row */}
          <tr>
            <td style={tdLabelStyle}>
              <i className="ri-checkbox-circle-line" style={{ marginRight: '0.5rem' }} />
              Số sản phẩm
            </td>
            {packages.map((pkg) => (
              <td key={pkg.id} style={tdValueStyle}>
                {pkg.totalItems} sản phẩm
              </td>
            ))}
          </tr>

          {/* Warranty Row */}
          <tr>
            <td style={tdLabelStyle}>
              <i className="ri-shield-check-line" style={{ marginRight: '0.5rem' }} />
              Bảo hành
            </td>
            {packages.map((pkg) => (
              <td key={pkg.id} style={tdValueStyle}>
                {pkg.warrantyMonths ? `${pkg.warrantyMonths} tháng` : '-'}
              </td>
            ))}
          </tr>

          {/* Installation Row */}
          <tr>
            <td style={tdLabelStyle}>
              <i className="ri-tools-line" style={{ marginRight: '0.5rem' }} />
              Thời gian lắp đặt
            </td>
            {packages.map((pkg) => (
              <td key={pkg.id} style={tdValueStyle}>
                {pkg.installationDays ? `${pkg.installationDays} ngày` : '-'}
              </td>
            ))}
          </tr>

          {/* Room Breakdown */}
          {allRooms.map((room) => (
            <RoomRow
              key={room}
              room={room}
              packages={packages}
              getRoomItems={getRoomItems}
              getRoomTotal={getRoomTotal}
              isExpanded={expandedRooms.has(room)}
              onToggle={() => toggleRoom(room)}
            />
          ))}

          {/* Select Button Row */}
          <tr>
            <td style={tdLabelStyle}></td>
            {packages.map((pkg) => (
              <td key={pkg.id} style={{ ...tdValueStyle, padding: '1rem' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(pkg)}
                  style={selectButtonStyle}
                >
                  Chọn gói này
                </motion.button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface RoomRowProps {
  room: string;
  packages: PackageDetail[];
  getRoomItems: (pkg: PackageDetail, room: string) => PackageItem[];
  getRoomTotal: (items: PackageItem[]) => number;
  isExpanded: boolean;
  onToggle: () => void;
}

function RoomRow({
  room,
  packages,
  getRoomItems,
  getRoomTotal,
  isExpanded,
  onToggle,
}: RoomRowProps) {
  return (
    <>
      {/* Room Header */}
      <tr onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td style={{ ...tdLabelStyle, background: tokens.color.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i
              className={isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}
              style={{ color: tokens.color.textMuted }}
            />
            <i className="ri-home-4-line" style={{ color: tokens.color.primary }} />
            <span style={{ fontWeight: 600 }}>{room}</span>
          </div>
        </td>
        {packages.map((pkg) => {
          const items = getRoomItems(pkg, room);
          const total = getRoomTotal(items);
          return (
            <td key={pkg.id} style={{ ...tdValueStyle, background: tokens.color.surface }}>
              <span style={{ fontWeight: 500 }}>
                {items.length > 0 ? `${items.length} sản phẩm` : '-'}
              </span>
              {total > 0 && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: tokens.color.textMuted }}>
                  {total.toLocaleString('vi-VN')}đ
                </span>
              )}
            </td>
          );
        })}
      </tr>

      {/* Room Items (Expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <td colSpan={packages.length + 1} style={{ padding: 0 }}>
              <div style={itemsContainerStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {getUniqueItems(packages, room, getRoomItems).map((itemName, idx) => (
                      <tr key={idx}>
                        <td style={itemLabelStyle}>{itemName}</td>
                        {packages.map((pkg) => {
                          const items = getRoomItems(pkg, room);
                          const item = items.find((i) => i.name === itemName);
                          return (
                            <td key={pkg.id} style={itemValueStyle}>
                              {item ? (
                                <div>
                                  <span>{item.qty}x</span>
                                  {item.brand && (
                                    <span style={{ fontSize: '0.7rem', color: tokens.color.textMuted, display: 'block' }}>
                                      {item.brand}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: tokens.color.textMuted }}>-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// Get unique item names across all packages for a room
function getUniqueItems(
  packages: PackageDetail[],
  room: string,
  getRoomItems: (pkg: PackageDetail, room: string) => PackageItem[]
): string[] {
  const itemSet = new Set<string>();
  packages.forEach((pkg) => {
    const items = getRoomItems(pkg, room);
    items.forEach((item) => itemSet.add(item.name));
  });
  return Array.from(itemSet);
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'inline-block' }}
      >
        <i className="ri-loader-4-line" style={{ fontSize: '2rem', color: tokens.color.primary }} />
      </motion.div>
      <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>Đang tải thông tin...</p>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem' }}>
      <i className="ri-error-warning-line" style={{ fontSize: '2rem', color: tokens.color.error }} />
      <p style={{ color: tokens.color.error, marginTop: '1rem' }}>{error}</p>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 'clamp(0.5rem, 2vw, 1rem)',
};

const modalStyle: React.CSSProperties = {
  background: tokens.color.background,
  borderRadius: tokens.radius.lg,
  width: '100%',
  maxWidth: '900px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: 'clamp(0.5rem, 2vw, 1rem)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.5rem',
  borderBottom: `1px solid ${tokens.color.border}`,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: 600,
  color: tokens.color.text,
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '1.5rem',
  color: tokens.color.textMuted,
  cursor: 'pointer',
  padding: '0.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '1rem',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '600px',
};

const thStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'center',
  borderBottom: `2px solid ${tokens.color.border}`,
  background: tokens.color.surface,
  verticalAlign: 'bottom',
};

const thumbnailStyle: React.CSSProperties = {
  width: '80px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: tokens.radius.sm,
  margin: '0 auto',
};

const tdLabelStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: `1px solid ${tokens.color.border}`,
  color: tokens.color.text,
  fontSize: '0.875rem',
};

const tdValueStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: `1px solid ${tokens.color.border}`,
  textAlign: 'center',
  color: tokens.color.text,
  fontSize: '0.875rem',
};

const priceStyle: React.CSSProperties = {
  color: tokens.color.primary,
  fontWeight: 700,
  fontSize: '1rem',
};

const selectButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
  background: tokens.color.primary,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
  minHeight: '44px', // Touch target
};

const itemsContainerStyle: React.CSSProperties = {
  background: `${tokens.color.surface}80`,
  padding: '0.5rem 1rem',
};

const itemLabelStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  color: tokens.color.textMuted,
  width: '200px',
};

const itemValueStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  textAlign: 'center',
};

export default PackageComparison;
