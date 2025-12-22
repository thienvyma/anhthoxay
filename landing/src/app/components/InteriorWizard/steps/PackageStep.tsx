/**
 * PackageStep - Step 6: Select interior package or custom furniture
 */

import { tokens, API_URL, resolveMediaUrl } from '@app/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { Package, FurnitureCategory, FurnitureItem, CustomSelection } from '../types';
import { SkeletonLoader } from '../SkeletonLoader';
import { PackageComparison } from '../components/PackageComparison';
import { PackageDetailModal } from '../components/PackageDetailModal';

interface PackageStepProps {
  layoutId: string;
  selected: Package | null;
  customSelection?: CustomSelection;
  onSelect: (pkg: Package) => void;
  onCustomSelect?: (selection: CustomSelection) => void;
  onBack: () => void;
}

type SelectionMode = 'package' | 'custom';

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Cơ bản', color: tokens.color.textMuted },
  2: { label: 'Tiêu chuẩn', color: tokens.color.info },
  3: { label: 'Cao cấp', color: tokens.color.warning },
  4: { label: 'Sang trọng', color: tokens.color.primary },
};

export function PackageStep({
  layoutId,
  selected,
  customSelection,
  onSelect,
  onCustomSelect,
  onBack,
}: PackageStepProps) {
  const [mode, setMode] = useState<SelectionMode>(customSelection ? 'custom' : 'package');
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [detailPackageId, setDetailPackageId] = useState<string | null>(null);

  // Custom selection state
  const [categories, setCategories] = useState<FurnitureCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [customItems, setCustomItems] = useState<Map<string, { item: FurnitureItem; qty: number }>>(
    new Map(customSelection?.items?.map((i) => [i.item.id, i]) || [])
  );
  const [loadingFurniture, setLoadingFurniture] = useState(false);

  useEffect(() => {
    if (layoutId) {
      fetchPackages();
    }
  }, [layoutId]);

  // Fetch categories only when switching to custom mode
  useEffect(() => {
    if (mode === 'custom' && categories.length === 0) {
      fetchCategories();
    }
  }, [mode, categories.length]);

  useEffect(() => {
    if (selectedCategory) {
      fetchFurnitureItems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/interior/packages?layoutId=${layoutId}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const json = await response.json();
      const data = json.data || json;
      setPackages(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(`${API_URL}/api/interior/furniture/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const json = await response.json();
      const data = json.data || json;
      setCategories(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchFurnitureItems = async (categoryId: string) => {
    try {
      setLoadingFurniture(true);
      const response = await fetch(`${API_URL}/api/interior/furniture/items?categoryId=${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const json = await response.json();
      const data = json.data || json;
      setFurnitureItems(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('Failed to fetch furniture items:', err);
    } finally {
      setLoadingFurniture(false);
    }
  };

  const toggleCompare = (pkgId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(pkgId)) return prev.filter((id) => id !== pkgId);
      if (prev.length >= 3) return prev;
      return [...prev, pkgId];
    });
  };

  const handleCompareSelect = (pkg: Package) => {
    setShowComparison(false);
    onSelect(pkg);
  };

  const addCustomItem = useCallback((item: FurnitureItem) => {
    setCustomItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(item.id);
      if (existing) {
        newMap.set(item.id, { item, qty: existing.qty + 1 });
      } else {
        newMap.set(item.id, { item, qty: 1 });
      }
      return newMap;
    });
  }, []);

  const removeCustomItem = useCallback((itemId: string) => {
    setCustomItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId);
      if (existing && existing.qty > 1) {
        newMap.set(itemId, { ...existing, qty: existing.qty - 1 });
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  }, []);

  const customTotal = Array.from(customItems.values()).reduce(
    (sum, { item, qty }) => sum + item.price * qty,
    0
  );

  const customItemCount = Array.from(customItems.values()).reduce((sum, { qty }) => sum + qty, 0);

  const handleCustomContinue = () => {
    if (onCustomSelect && customItems.size > 0) {
      onCustomSelect({
        items: Array.from(customItems.values()),
        totalPrice: customTotal,
        totalItems: customItemCount,
      });
    }
  };

  if (loading) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <h2 style={headerStyle}>Chọn Gói Nội Thất</h2>
        <SkeletonLoader count={3} type="card" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <BackButton onClick={onBack} />
        <i className="ri-error-warning-line" style={{ fontSize: '3rem', color: tokens.color.error, marginBottom: '1rem' }} />
        <p style={{ color: tokens.color.error, marginBottom: '1rem' }}>{error}</p>
        <button onClick={fetchPackages} style={retryButtonStyle}>Thử lại</button>
      </div>
    );
  }

  const sortedPackages = [...packages].sort((a, b) => a.tier - b.tier);

  return (
    <div>
      <BackButton onClick={onBack} />
      <h2 style={headerStyle}>Chọn Gói Nội Thất</h2>
      <p style={subtitleStyle}>Chọn gói có sẵn hoặc tự chọn từng món nội thất</p>

      {/* Mode Tabs */}
      <div style={modeTabsStyle}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('package')}
          style={{ ...modeTabStyle, ...(mode === 'package' ? activeTabStyle : {}) }}
        >
          <i className="ri-gift-line" style={{ marginRight: '0.5rem' }} />
          Gói có sẵn
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode('custom')}
          style={{ ...modeTabStyle, ...(mode === 'custom' ? activeTabStyle : {}) }}
        >
          <i className="ri-list-check-2" style={{ marginRight: '0.5rem' }} />
          Tự chọn riêng lẻ
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'package' ? (
          <motion.div
            key="package"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Package Selection */}
            {packages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="ri-gift-line" style={{ fontSize: '3rem', color: tokens.color.textMuted, marginBottom: '1rem' }} />
                <p style={{ color: tokens.color.textMuted }}>Chưa có gói nội thất nào cho layout này</p>
                <p style={{ color: tokens.color.textMuted, fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Hãy thử chọn "Tự chọn riêng lẻ" để tự tạo gói của bạn
                </p>
              </div>
            ) : (
              <>
                {/* Compare Button */}
                {packages.length > 1 && (
                  <div style={compareBarStyle}>
                    <span style={{ color: tokens.color.textMuted, fontSize: '0.875rem' }}>
                      {compareIds.length > 0 ? `Đã chọn ${compareIds.length} gói để so sánh` : 'Chọn 2-3 gói để so sánh'}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowComparison(true)}
                      disabled={compareIds.length < 2}
                      style={{ ...compareButtonStyle, opacity: compareIds.length < 2 ? 0.5 : 1, cursor: compareIds.length < 2 ? 'not-allowed' : 'pointer' }}
                    >
                      <i className="ri-scales-3-line" style={{ marginRight: '0.5rem' }} />
                      So sánh
                    </motion.button>
                  </div>
                )}

                <div style={gridStyle}>
                  {sortedPackages.map((pkg, index) => (
                    <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <PackageCard
                        pkg={pkg}
                        isSelected={selected?.id === pkg.id}
                        isComparing={compareIds.includes(pkg.id)}
                        onSelect={() => onSelect(pkg)}
                        onToggleCompare={() => toggleCompare(pkg.id)}
                        onViewDetail={() => setDetailPackageId(pkg.id)}
                        showCompareCheckbox={packages.length > 1}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CustomFurnitureSelection
              categories={categories}
              loadingCategories={loadingCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              furnitureItems={furnitureItems}
              loadingFurniture={loadingFurniture}
              customItems={customItems}
              onAddItem={addCustomItem}
              onRemoveItem={removeCustomItem}
              customTotal={customTotal}
              customItemCount={customItemCount}
              onContinue={handleCustomContinue}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Modal */}
      {showComparison && (
        <PackageComparison packages={packages} selectedIds={compareIds} onClose={() => setShowComparison(false)} onSelect={handleCompareSelect} />
      )}

      {/* Detail Modal */}
      {detailPackageId && (
        <PackageDetailModal packageId={detailPackageId} onClose={() => setDetailPackageId(null)} onSelect={(pkg) => { setDetailPackageId(null); onSelect(pkg); }} />
      )}
    </div>
  );
}

// Custom Furniture Selection Component
interface CustomFurnitureSelectionProps {
  categories: FurnitureCategory[];
  loadingCategories: boolean;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  furnitureItems: FurnitureItem[];
  loadingFurniture: boolean;
  customItems: Map<string, { item: FurnitureItem; qty: number }>;
  onAddItem: (item: FurnitureItem) => void;
  onRemoveItem: (itemId: string) => void;
  customTotal: number;
  customItemCount: number;
  onContinue: () => void;
}

function CustomFurnitureSelection({
  categories,
  loadingCategories,
  selectedCategory,
  onSelectCategory,
  furnitureItems,
  loadingFurniture,
  customItems,
  onAddItem,
  onRemoveItem,
  customTotal,
  customItemCount,
  onContinue,
}: CustomFurnitureSelectionProps) {
  // Show loading state
  if (loadingCategories) {
    return <SkeletonLoader count={4} type="list" />;
  }

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <i className="ri-folder-open-line" style={{ fontSize: '3rem', color: tokens.color.textMuted }} />
        <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>
          Chưa có danh mục nội thất nào
        </p>
        <p style={{ color: tokens.color.textMuted, fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Vui lòng liên hệ admin để thêm danh mục sản phẩm
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Category Tabs */}
      <div style={categoryTabsStyle}>
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory(cat.id)}
            style={{
              ...categoryTabStyle,
              ...(selectedCategory === cat.id ? activeCategoryStyle : {}),
            }}
          >
            <i className={cat.icon || 'ri-home-line'} style={{ marginRight: '0.5rem' }} />
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Furniture Items Grid */}
      {selectedCategory ? (
        loadingFurniture ? (
          <SkeletonLoader count={4} type="card" />
        ) : furnitureItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <i className="ri-inbox-line" style={{ fontSize: '3rem', color: tokens.color.textMuted }} />
            <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>Chưa có sản phẩm trong danh mục này</p>
          </div>
        ) : (
          <div style={furnitureGridStyle}>
            {furnitureItems.map((item) => {
              const inCart = customItems.get(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={furnitureCardStyle}
                >
                  {/* Image */}
                  <div style={furnitureImageStyle}>
                    {item.thumbnail ? (
                      <img src={resolveMediaUrl(item.thumbnail)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <i className="ri-image-line" style={{ fontSize: '2rem', color: tokens.color.textMuted }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '0.75rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.875rem', color: tokens.color.text, fontWeight: 500 }}>{item.name}</h4>
                    {item.brand && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: tokens.color.textMuted }}>{item.brand}</p>}
                    <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: tokens.color.primary, fontWeight: 600 }}>
                      {item.price.toLocaleString('vi-VN')} đ
                    </p>

                    {/* Add/Remove Buttons */}
                    <div style={qtyControlStyle}>
                      {inCart ? (
                        <>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemoveItem(item.id)} style={qtyBtnStyle}>
                            <i className="ri-subtract-line" />
                          </motion.button>
                          <span style={{ minWidth: '2rem', textAlign: 'center', color: tokens.color.text }}>{inCart.qty}</span>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onAddItem(item)} style={qtyBtnStyle}>
                            <i className="ri-add-line" />
                          </motion.button>
                        </>
                      ) : (
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onAddItem(item)} style={addBtnStyle}>
                          <i className="ri-add-line" style={{ marginRight: '0.25rem' }} />
                          Thêm
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="ri-cursor-line" style={{ fontSize: '3rem', color: tokens.color.textMuted }} />
          <p style={{ color: tokens.color.textMuted, marginTop: '1rem' }}>Chọn một danh mục để xem sản phẩm</p>
        </div>
      )}

      {/* Cart Summary */}
      {customItemCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cartSummaryStyle}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, color: tokens.color.text, fontWeight: 500 }}>
              <i className="ri-shopping-cart-2-line" style={{ marginRight: '0.5rem' }} />
              {customItemCount} sản phẩm
            </p>
            <p style={{ margin: '0.25rem 0 0', color: tokens.color.primary, fontSize: '1.25rem', fontWeight: 700 }}>
              {customTotal.toLocaleString('vi-VN')} đ
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onContinue} style={continueButtonStyle}>
            Tiếp tục
            <i className="ri-arrow-right-line" style={{ marginLeft: '0.5rem' }} />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// Package Card Component
interface PackageCardProps {
  pkg: Package;
  isSelected: boolean;
  isComparing: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onViewDetail: () => void;
  showCompareCheckbox: boolean;
}

function PackageCard({ pkg, isSelected, isComparing, onSelect, onToggleCompare, onViewDetail, showCompareCheckbox }: PackageCardProps) {
  const tierInfo = TIER_LABELS[pkg.tier] || TIER_LABELS[1];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        background: isSelected ? `${tokens.color.primary}15` : tokens.color.background,
        border: `2px solid ${isSelected ? tokens.color.primary : isComparing ? tokens.color.info : tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Compare Checkbox */}
      {showCompareCheckbox && (
        <div onClick={(e) => { e.stopPropagation(); onToggleCompare(); }} style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 2 }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: tokens.radius.sm,
              border: `2px solid ${isComparing ? tokens.color.info : tokens.color.border}`,
              background: isComparing ? tokens.color.info : tokens.color.background,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            {isComparing && <i className="ri-check-line" style={{ color: '#fff', fontSize: '14px' }} />}
          </motion.div>
        </div>
      )}

      {/* Featured Badge */}
      {pkg.isFeatured && (
        <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: tokens.color.primary, color: '#fff', fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: tokens.radius.sm, zIndex: 1 }}>
          <i className="ri-star-fill" style={{ marginRight: '0.25rem' }} />
          Đề xuất
        </div>
      )}

      {/* Image */}
      <div style={{ width: '100%', height: '150px', background: tokens.color.surface, overflow: 'hidden' }}>
        {pkg.thumbnail ? (
          <img src={resolveMediaUrl(pkg.thumbnail)} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-gift-line" style={{ fontSize: '3rem', color: tokens.color.textMuted }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        <span style={{ display: 'inline-block', padding: '0.25rem 0.5rem', background: `${tierInfo.color}20`, color: tierInfo.color, fontSize: '0.7rem', fontWeight: 600, borderRadius: tokens.radius.sm, marginBottom: '0.5rem' }}>
          {tierInfo.label}
        </span>
        <h3 style={{ margin: '0 0 0.5rem', color: tokens.color.text, fontSize: '1rem', fontWeight: 600 }}>{pkg.name}</h3>
        {pkg.shortDescription && (
          <p style={{ margin: '0 0 0.75rem', color: tokens.color.textMuted, fontSize: '0.8rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {pkg.shortDescription}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
          <span style={{ color: tokens.color.primary, fontSize: '1.25rem', fontWeight: 700 }}>{pkg.basePrice.toLocaleString('vi-VN')}</span>
          <span style={{ color: tokens.color.textMuted, fontSize: '0.8rem' }}>đ</span>
        </div>
        <p style={{ margin: '0.5rem 0 0', color: tokens.color.textMuted, fontSize: '0.75rem' }}>
          <i className="ri-checkbox-circle-line" style={{ marginRight: '0.25rem' }} />
          {pkg.totalItems || 0} sản phẩm
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
          style={{ marginTop: '0.75rem', width: '100%', padding: '0.5rem', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: tokens.color.textMuted, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
        >
          <i className="ri-eye-line" />
          Xem chi tiết
        </motion.button>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', width: '28px', height: '28px', borderRadius: '50%', background: tokens.color.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="ri-check-line" style={{ color: '#fff', fontSize: '16px' }} />
        </motion.div>
      )}
    </motion.div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: tokens.color.textMuted, cursor: 'pointer', marginBottom: '1rem', padding: '0.5rem', fontSize: '0.875rem' }}
    >
      <i className="ri-arrow-left-line" />
      Quay lại
    </motion.button>
  );
}

// Styles
const headerStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: tokens.color.text,
  marginBottom: '0.5rem',
  textAlign: 'center',
};

const subtitleStyle: React.CSSProperties = {
  color: tokens.color.textMuted,
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const modeTabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  background: tokens.color.surface,
  padding: '0.25rem',
  borderRadius: tokens.radius.md,
};

const modeTabStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.75rem 1rem',
  background: 'transparent',
  border: 'none',
  borderRadius: tokens.radius.sm,
  color: tokens.color.textMuted,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const activeTabStyle: React.CSSProperties = {
  background: tokens.color.primary,
  color: tokens.color.background,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
  gap: 'clamp(0.75rem, 2vw, 1rem)',
};

const compareBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  background: tokens.color.surface,
  borderRadius: tokens.radius.md,
  marginBottom: '1rem',
};

const compareButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 1rem',
  background: tokens.color.info,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  fontWeight: 500,
  fontSize: '0.875rem',
  minHeight: '44px', // Touch target
};

const retryButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: tokens.color.primary,
  color: tokens.color.background,
  border: 'none',
  borderRadius: tokens.radius.md,
  cursor: 'pointer',
  fontWeight: 500,
  minHeight: '44px', // Touch target
};

const categoryTabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  overflowX: 'auto',
  paddingBottom: '0.5rem',
};

const categoryTabStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  color: tokens.color.textMuted,
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
};

const activeCategoryStyle: React.CSSProperties = {
  background: tokens.color.primary,
  borderColor: tokens.color.primary,
  color: tokens.color.background,
};

const furnitureGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
  gap: 'clamp(0.75rem, 2vw, 1rem)',
};

const furnitureCardStyle: React.CSSProperties = {
  background: tokens.color.surface,
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.md,
  overflow: 'hidden',
};

const furnitureImageStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  background: tokens.color.background,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const qtyControlStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  marginTop: '0.75rem',
};

const qtyBtnStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: tokens.radius.sm,
  border: `1px solid ${tokens.color.border}`,
  background: tokens.color.background,
  color: tokens.color.text,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.sm,
  color: tokens.color.background,
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '36px', // Touch target
};

const cartSummaryStyle: React.CSSProperties = {
  position: 'sticky',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  background: tokens.color.surface,
  borderTop: `1px solid ${tokens.color.border}`,
  borderRadius: `${tokens.radius.lg} ${tokens.radius.lg} 0 0`,
  marginTop: '1.5rem',
};

const continueButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: tokens.color.primary,
  border: 'none',
  borderRadius: tokens.radius.md,
  color: tokens.color.background,
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  minHeight: '44px', // Touch target
};

export default PackageStep;
