/**
 * Contractor My Bids Page
 *
 * Displays:
 * - Status tabs (pending, won, lost) (Requirement 10.1)
 * - Bid cards with project info (Requirement 10.2)
 * - Edit/withdraw for pending bids (Requirement 10.3)
 * - Contact info for selected bids (Requirement 10.4, 10.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 10.1, 10.2, 10.3, 10.4, 10.5**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useToast } from '../../components/Toast';
import {
  ResponsivePageHeader,
  useResponsive,
} from '../../components/responsive';
import {
  bidsApi,
  type Bid,
  type BidStatus,
  type BidQuery,
} from '../../api';

type TabStatus = 'all' | 'pending' | 'won' | 'lost';

interface Tab {
  id: TabStatus;
  label: string;
  statuses: BidStatus[];
  icon: string;
}

const TABS: Tab[] = [
  { id: 'all', label: 'Tất cả', statuses: [], icon: 'ri-list-check' },
  { id: 'pending', label: 'Đang chờ', statuses: ['PENDING', 'APPROVED'], icon: 'ri-time-line' },
  { id: 'won', label: 'Thắng', statuses: ['SELECTED'], icon: 'ri-trophy-line' },
  { id: 'lost', label: 'Không thắng', statuses: ['NOT_SELECTED', 'REJECTED', 'WITHDRAWN'], icon: 'ri-close-circle-line' },
];

const STATUS_LABELS: Record<BidStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  SELECTED: 'Được chọn',
  NOT_SELECTED: 'Không được chọn',
  WITHDRAWN: 'Đã rút',
};

const STATUS_COLORS: Record<BidStatus, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#3b82f6',
  REJECTED: '#ef4444',
  SELECTED: '#22c55e',
  NOT_SELECTED: '#71717a',
  WITHDRAWN: '#71717a',
};


export function MyBidsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { isMobile } = useResponsive();

  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [withdrawingBidId, setWithdrawingBidId] = useState<string | null>(null);

  // Get initial values from URL params
  const initialTab = (searchParams.get('tab') as TabStatus) || 'all';
  const initialStatus = searchParams.get('status') as BidStatus | null;
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadBids = useCallback(async () => {
    setIsLoading(true);
    try {
      const tab = TABS.find((t) => t.id === activeTab);
      const query: BidQuery = {
        page: currentPage,
        limit: 12,
        sortBy,
        sortOrder,
      };

      // If specific status from URL, use it
      if (initialStatus && activeTab === 'all') {
        query.status = initialStatus;
      } else if (tab && tab.statuses.length === 1) {
        query.status = tab.statuses[0];
      }

      const result = await bidsApi.getBids(query);

      // If tab has multiple statuses, filter client-side
      let filteredData = result.data;
      if (tab && tab.statuses.length > 1) {
        filteredData = result.data.filter((b) => tab.statuses.includes(b.status));
      }

      setBids(filteredData);
      setTotalPages(result.meta.totalPages);
      setTotalCount(result.meta.total);
    } catch (error) {
      console.error('Failed to load bids:', error);
      setBids([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, sortBy, sortOrder, initialStatus]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('tab', activeTab);
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, setSearchParams]);

  const handleTabChange = (tabId: TabStatus) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };

  const handleWithdrawBid = async (bidId: string) => {
    if (!confirm('Bạn có chắc muốn rút đề xuất này?')) return;

    setWithdrawingBidId(bidId);
    try {
      await bidsApi.withdrawBid(bidId);
      showToast('Đã rút đề xuất thành công', 'success');
      loadBids();
    } catch (error) {
      console.error('Failed to withdraw bid:', error);
      showToast('Không thể rút đề xuất. Vui lòng thử lại.', 'error');
    } finally {
      setWithdrawingBidId(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const canEditBid = (bid: Bid): boolean => {
    return bid.status === 'PENDING';
  };

  const canWithdrawBid = (bid: Bid): boolean => {
    return bid.status === 'PENDING' || bid.status === 'APPROVED';
  };

  const isSelectedBid = (bid: Bid): boolean => {
    return bid.status === 'SELECTED';
  };

  // Render bid card for mobile
  const renderBidCard = (bid: Bid, index: number) => (
    <motion.div
      key={bid.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="card"
      style={{
        padding: isMobile ? 16 : 20,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 12,
        }}
      >
        <span
          className="badge"
          style={{
            background: `${STATUS_COLORS[bid.status]}20`,
            color: STATUS_COLORS[bid.status],
          }}
        >
          {STATUS_LABELS[bid.status]}
        </span>
        <span style={{ fontSize: 12, color: '#71717a' }}>{bid.code}</span>
      </div>

      {/* Project Info - Requirement 10.2 */}
      {bid.project && (
        <div
          style={{
            padding: 12,
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#e4e7ec',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bid.project.title}
          </h3>
          <div style={{ fontSize: 12, color: '#71717a' }}>
            {bid.project.code} • {bid.project.region?.name || 'Chưa xác định'}
          </div>
        </div>
      )}

      {/* Bid Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
            Giá đề xuất
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#f5d393' }}>
            {formatCurrency(bid.price)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>
            Thời gian
          </div>
          <div style={{ fontSize: 14, color: '#e4e7ec' }}>{bid.timeline}</div>
        </div>
      </div>

      {/* Proposal Preview */}
      <p
        style={{
          fontSize: 13,
          color: '#a1a1aa',
          marginBottom: 16,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {bid.proposal}
      </p>

      {/* Contact Info for Selected Bids - Requirements 10.4, 10.5 */}
      {isSelectedBid(bid) && bid.project?.owner && (
        <div
          style={{
            padding: 12,
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#22c55e',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ri-user-line" />
            Thông tin chủ nhà
          </div>
          <div style={{ fontSize: 14, color: '#e4e7ec', marginBottom: 4 }}>
            {bid.project.owner.name}
          </div>
          {bid.project.owner.email && (
            <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 2 }}>
              <i className="ri-mail-line" style={{ marginRight: 6 }} />
              {bid.project.owner.email}
            </div>
          )}
          {bid.project.owner.phone && (
            <div style={{ fontSize: 13, color: '#a1a1aa' }}>
              <i className="ri-phone-line" style={{ marginRight: 6 }} />
              {bid.project.owner.phone}
            </div>
          )}
        </div>
      )}

      {/* Review Note for Rejected */}
      {bid.status === 'REJECTED' && bid.reviewNote && (
        <div
          style={{
            padding: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#ef4444',
              marginBottom: 4,
            }}
          >
            Lý do từ chối
          </div>
          <div style={{ fontSize: 13, color: '#a1a1aa' }}>{bid.reviewNote}</div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 12 : 0,
          paddingTop: 12,
          borderTop: '1px solid #27272a',
          marginTop: 'auto',
        }}
      >
        <span style={{ fontSize: 12, color: '#71717a' }}>
          {formatDate(bid.createdAt)}
        </span>

        {/* Actions - Requirement 10.3 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canEditBid(bid) && (
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: 13, flex: isMobile ? 1 : 'none' }}
              onClick={() =>
                navigate(`/contractor/marketplace/${bid.projectId}/bid?edit=${bid.id}`)
              }
            >
              <i className="ri-edit-line" style={{ marginRight: 4 }} />
              Sửa
            </button>
          )}
          {canWithdrawBid(bid) && (
            <button
              className="btn btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                flex: isMobile ? 1 : 'none',
              }}
              onClick={() => handleWithdrawBid(bid.id)}
              disabled={withdrawingBidId === bid.id}
            >
              {withdrawingBidId === bid.id ? (
                <i className="ri-loader-4-line spinner" />
              ) : (
                <>
                  <i className="ri-close-line" style={{ marginRight: 4 }} />
                  Rút
                </>
              )}
            </button>
          )}
          {isSelectedBid(bid) && (
            <button
              className="btn btn-primary"
              style={{ padding: '6px 12px', fontSize: 13, flex: isMobile ? 1 : 'none' }}
              onClick={() => navigate(`/contractor/my-bids/${bid.id}`)}
            >
              <i className="ri-chat-1-line" style={{ marginRight: 4 }} />
              Liên hệ
            </button>
          )}
          <button
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: 13, flex: isMobile ? 1 : 'none' }}
            onClick={() => navigate(`/contractor/my-bids/${bid.id}`)}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Layout>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        {/* Header */}
        <ResponsivePageHeader
          title="Đề xuất của tôi"
          subtitle="Quản lý và theo dõi tất cả đề xuất đã gửi"
          icon="ri-file-list-3-line"
        />

        {/* Tabs - Requirement 10.1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            overflowX: 'auto',
            paddingBottom: 4,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '8px 12px' : '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#f5d393' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: isMobile ? 13 : 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                minHeight: 44, // Touch target
              }}
            >
              <i className={tab.icon} style={{ fontSize: 16 }} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Sort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <span style={{ color: '#71717a', fontSize: 14 }}>
            {isLoading ? 'Đang tải...' : `${totalCount} đề xuất`}
          </span>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder as 'asc' | 'desc');
            }}
            className="input"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="createdAt-desc">Mới nhất</option>
            <option value="createdAt-asc">Cũ nhất</option>
            <option value="price-desc">Giá cao nhất</option>
            <option value="price-asc">Giá thấp nhất</option>
          </select>
        </motion.div>


        {/* Bid Cards - Requirements 10.2, 10.3, 10.4, 10.5 */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: isMobile ? 16 : 20,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card"
                style={{ padding: 20, height: 280, background: '#1a1a1f' }}
              >
                <div
                  style={{
                    width: '60%',
                    height: 20,
                    background: '#27272a',
                    borderRadius: 4,
                    marginBottom: 12,
                  }}
                />
                <div
                  style={{
                    width: '40%',
                    height: 16,
                    background: '#27272a',
                    borderRadius: 4,
                    marginBottom: 20,
                  }}
                />
                <div
                  style={{
                    width: '100%',
                    height: 60,
                    background: '#27272a',
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
        ) : bids.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: isMobile ? 16 : 20,
            }}
          >
            {bids.map((bid, index) => renderBidCard(bid, index))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card"
            style={{
              padding: 60,
              textAlign: 'center',
            }}
          >
            <i
              className="ri-file-list-3-line"
              style={{ fontSize: 48, color: '#71717a', marginBottom: 16, display: 'block' }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
              Chưa có đề xuất nào
            </h3>
            <p style={{ color: '#a1a1aa', marginBottom: 24 }}>
              {activeTab === 'pending'
                ? 'Bạn chưa có đề xuất đang chờ'
                : activeTab === 'won'
                ? 'Bạn chưa có đề xuất thắng'
                : activeTab === 'lost'
                ? 'Bạn chưa có đề xuất không thắng'
                : 'Tìm dự án và gửi đề xuất đầu tiên'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/contractor/marketplace')}
            >
              <i className="ri-search-line" style={{ marginRight: 8 }} />
              Tìm dự án
            </button>
          </motion.div>
        )}


        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 32,
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '8px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <i className="ri-arrow-left-s-line" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: 'none',
                    background: currentPage === pageNum ? '#f5d393' : 'transparent',
                    color: currentPage === pageNum ? '#0b0c0f' : '#a1a1aa',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="btn btn-secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '8px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
