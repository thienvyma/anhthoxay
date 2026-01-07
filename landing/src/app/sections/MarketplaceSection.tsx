/**
 * Marketplace Section for Landing Page
 *
 * Displays public projects (OPEN status) to attract contractors and homeowners
 * - Shows limited project info (no address, no owner)
 * - CTA to register/login
 * - Stats to show platform activity
 *
 * **Feature: marketplace-landing**
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { tokens } from '@app/shared';
import { glassEffect } from '../styles/glassEffect';
import { marketplaceAPI } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import type { Project, Region, ServiceCategory } from '../api';

interface MarketplaceSectionData {
  title?: string;
  subtitle?: string;
  showStats?: boolean;
  limit?: number;
  ctaText?: string;
  ctaLink?: string;
  registerText?: string;
  registerLink?: string;
}

interface Props {
  data: MarketplaceSectionData;
}

// Budget range options
const BUDGET_RANGES = [
  { label: 'Tất cả ngân sách', min: undefined, max: undefined },
  { label: 'Dưới 50 triệu', min: undefined, max: 50000000 },
  { label: '50 - 100 triệu', min: 50000000, max: 100000000 },
  { label: '100 - 200 triệu', min: 100000000, max: 200000000 },
  { label: 'Trên 200 triệu', min: 200000000, max: undefined },
];

export const MarketplaceSection = memo(function MarketplaceSection({ data }: Props) {
  const navigate = useNavigate();
  const {
    title = 'Công trình đang tìm nhà thầu',
    subtitle = 'Khám phá các dự án xây dựng đang chờ báo giá từ nhà thầu uy tín',
    showStats = true,
    limit = 6,
    ctaText = 'Xem tất cả công trình',
    ctaLink = '/portal/marketplace',
    registerText = 'Đăng ký làm nhà thầu',
    registerLink = '/portal/auth/register?type=contractor',
  } = data;

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(0);
  
  // Debounce filter values with 500ms delay (Requirement 9.2)
  const debouncedRegion = useDebounce(selectedRegion, 500);
  const debouncedCategory = useDebounce(selectedCategory, 500);
  const debouncedBudgetIndex = useDebounce(selectedBudgetIndex, 500);
  const isFiltering = selectedRegion !== debouncedRegion || 
                      selectedCategory !== debouncedCategory || 
                      selectedBudgetIndex !== debouncedBudgetIndex;

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [regionsData, categoriesData] = await Promise.all([
          marketplaceAPI.getRegions(),
          marketplaceAPI.getCategories(),
        ]);
        setRegions(regionsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Load projects using debounced filter values
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await marketplaceAPI.getProjects({
        limit,
        regionId: debouncedRegion || undefined,
        categoryId: debouncedCategory || undefined,
      });

      // Client-side budget filtering
      let filteredData = result.data;
      const budgetRange = BUDGET_RANGES[debouncedBudgetIndex];
      if (budgetRange.min !== undefined || budgetRange.max !== undefined) {
        filteredData = result.data.filter((project) => {
          const projectBudget = project.budgetMax || project.budgetMin || 0;
          if (budgetRange.min !== undefined && projectBudget < budgetRange.min) return false;
          if (budgetRange.max !== undefined && projectBudget > budgetRange.max) return false;
          return true;
        });
      }

      setProjects(filteredData);
      setTotalCount(result.meta.total);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit, debouncedRegion, debouncedCategory, debouncedBudgetIndex]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Formatters
  const formatBudget = (min?: number, max?: number): string => {
    if (!min && !max) return 'Thương lượng';
    const format = (n: number) => {
      if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)} tỷ`;
      if (n >= 1000000) return `${(n / 1000000).toFixed(0)} triệu`;
      return new Intl.NumberFormat('vi-VN').format(n);
    };
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `Từ ${format(min)}`;
    if (max) return `Đến ${format(max)}`;
    return 'Thương lượng';
  };

  const getDaysRemaining = (deadline?: string): { text: string; isUrgent: boolean } | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return { text: 'Đã hết hạn', isUrgent: true };
    if (diffDays === 0) return { text: 'Hết hạn hôm nay', isUrgent: true };
    if (diffDays === 1) return { text: 'Còn 1 ngày', isUrgent: true };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày`, isUrgent: true };
    return { text: `Còn ${diffDays} ngày`, isUrgent: false };
  };

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
      if (link.startsWith('/')) {
        e.preventDefault();
        navigate(link);
      }
    },
    [navigate]
  );

  // Select styles
  const selectStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: tokens.radius.md,
    border: `1px solid rgba(255, 255, 255, 0.1)`,
    background: 'rgba(12, 12, 16, 0.6)',
    backdropFilter: 'blur(12px)',
    color: tokens.color.text,
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    width: '100%',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: 'clamp(40px, 6vw, 60px) clamp(20px, 4vw, 40px)',
          background: `linear-gradient(135deg, rgba(245,211,147,0.1) 0%, rgba(239,182,121,0.05) 100%)`,
          borderRadius: tokens.radius.xl,
          border: `1px solid ${tokens.color.border}`,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontFamily: tokens.font.display,
              color: tokens.color.primary,
              marginBottom: 12,
              fontWeight: 700,
            }}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{
              color: tokens.color.muted,
              fontSize: 'clamp(14px, 2vw, 16px)',
              maxWidth: 600,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Stats */}
        {showStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                value: totalCount || 0,
                label: 'Công trình đang mở',
                icon: 'ri-building-2-line',
                color: '#06b6d4',
              },
              {
                value: '200+',
                label: 'Nhà thầu xác minh',
                icon: 'ri-user-star-line',
                color: '#10b981',
              },
              {
                value: '98%',
                label: 'Khách hàng hài lòng',
                icon: 'ri-emotion-happy-line',
                color: tokens.color.primary,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i }}
                style={{
                  ...glassEffect({ variant: 'card' }),
                  padding: '20px 16px',
                  borderRadius: tokens.radius.lg,
                  textAlign: 'center',
                }}
              >
                <i
                  className={stat.icon}
                  style={{ fontSize: 28, color: stat.color, marginBottom: 8, display: 'block' }}
                />
                <div
                  style={{
                    fontSize: 'clamp(24px, 4vw, 32px)',
                    fontWeight: 700,
                    color: stat.color,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: tokens.color.muted, fontSize: 12 }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Filters with debounce indicator (Requirement 9.2, 9.5) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 12,
            marginBottom: 32,
            position: 'relative',
          }}
        >
          {/* Filtering indicator */}
          {isFiltering && (
            <div
              style={{
                position: 'absolute',
                top: -24,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: tokens.color.primary,
              }}
            >
              <motion.i
                className="ri-loader-4-line"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Đang lọc...
            </div>
          )}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={selectStyle}
          >
            <option value="">Tất cả khu vực</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={selectStyle}
          >
            <option value="">Tất cả hạng mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBudgetIndex}
            onChange={(e) => setSelectedBudgetIndex(parseInt(e.target.value, 10))}
            style={selectStyle}
          >
            {BUDGET_RANGES.map((range, index) => (
              <option key={index} value={index}>
                {range.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Project Cards */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: 20,
            }}
          >
            {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  ...glassEffect({ variant: 'card' }),
                  borderRadius: tokens.radius.lg,
                  padding: 24,
                  height: 280,
                }}
              >
                <div
                  style={{
                    width: '40%',
                    height: 24,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6,
                    marginBottom: 16,
                  }}
                />
                <div
                  style={{
                    width: '80%',
                    height: 20,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                  }}
                />
              </motion.div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: 20,
            }}
          >
            {projects.map((project, index) => {
              const deadline = getDaysRemaining(project.bidDeadline);

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ y: -6, scale: 1.01 }}
                  style={{
                    ...glassEffect({ variant: 'card' }),
                    borderRadius: tokens.radius.lg,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(6, 182, 212, 0.15)',
                        color: '#06b6d4',
                        padding: '6px 12px',
                        borderRadius: tokens.radius.sm,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 14 }} />
                      Đang mở
                    </span>
                    <span style={{ fontSize: 12, color: tokens.color.muted }}>{project.code}</span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: tokens.color.text,
                      marginBottom: 10,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 13,
                      color: tokens.color.muted,
                      marginBottom: 20,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.6,
                      minHeight: 42,
                    }}
                  >
                    {project.description}
                  </p>

                  {/* Info Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      marginBottom: 20,
                    }}
                  >
                    <InfoItem
                      icon="ri-map-pin-line"
                      label="Khu vực"
                      value={project.region?.name || 'Chưa xác định'}
                    />
                    <InfoItem
                      icon="ri-tools-line"
                      label="Hạng mục"
                      value={project.category?.name || 'Chưa xác định'}
                    />
                    <InfoItem
                      icon="ri-money-dollar-circle-line"
                      label="Ngân sách"
                      value={formatBudget(project.budgetMin, project.budgetMax)}
                      highlight
                    />
                    {project.area && (
                      <InfoItem
                        icon="ri-ruler-line"
                        label="Diện tích"
                        value={`${project.area} m²`}
                      />
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 16,
                      borderTop: `1px solid rgba(255, 255, 255, 0.08)`,
                      marginTop: 'auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: tokens.color.muted,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <i className="ri-file-list-3-line" />
                        {project.bidCount || 0}/{project.maxBids || 20} đề xuất
                      </span>
                      {deadline && (
                        <span
                          style={{
                            fontSize: 12,
                            color: deadline.isUrgent ? tokens.color.error : tokens.color.warning,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <i className="ri-time-line" />
                          {deadline.text}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              ...glassEffect({ variant: 'card' }),
              borderRadius: tokens.radius.lg,
              padding: 60,
              textAlign: 'center',
            }}
          >
            <i
              className="ri-inbox-2-line"
              style={{
                fontSize: 56,
                color: tokens.color.muted,
                marginBottom: 16,
                display: 'block',
                opacity: 0.5,
              }}
            />
            <h4 style={{ fontSize: 18, color: tokens.color.text, marginBottom: 8 }}>
              Chưa có công trình nào
            </h4>
            <p style={{ color: tokens.color.muted, fontSize: 14 }}>
              Hãy quay lại sau để xem các công trình mới
            </p>
          </motion.div>
        )}


        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 16,
            marginTop: 48,
          }}
        >
          <motion.a
            href={ctaLink}
            onClick={(e) => handleLinkClick(e, ctaLink)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
              color: '#111',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(245,211,147,0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            <i className="ri-arrow-right-line" />
            {ctaText}
          </motion.a>

          <motion.a
            href={registerLink}
            onClick={(e) => handleLinkClick(e, registerLink)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.05)',
              color: tokens.color.text,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999,
              fontWeight: 500,
              fontSize: 15,
              textDecoration: 'none',
              backdropFilter: 'blur(12px)',
              transition: 'all 0.3s ease',
            }}
          >
            <i className="ri-user-add-line" />
            {registerText}
          </motion.a>
        </motion.div>
      </motion.section>
    </div>
  );
});

// Helper component for info items
function InfoItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: tokens.color.muted,
          marginBottom: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <i className={icon} style={{ fontSize: 12 }} />
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          color: highlight ? tokens.color.primary : tokens.color.text,
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default MarketplaceSection;
