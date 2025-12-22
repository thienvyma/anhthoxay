/**
 * Contractor Bid Detail Page
 *
 * Displays:
 * - Bid details and status (Requirement 10.2)
 * - Project information
 * - Contact info for selected bids (Requirement 10.4, 10.5)
 * - Print support (Requirement 27.2)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 10.2, 10.4, 10.5, 27.2**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { LazyImage } from '../../components/LazyImage';
import { PrintButton, PrintHeader, PrintFooter, PrintSection, PrintInfoGrid } from '../../components/PrintSupport';
import { useToast } from '../../components/Toast';
import {
  bidsApi,
  type Bid,
  type BidStatus,
} from '../../api';

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

export function BidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [bid, setBid] = useState<Bid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBid = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const bidData = await bidsApi.getBid(id);
      setBid(bidData);
    } catch (err) {
      console.error('Failed to load bid:', err);
      setError('Không thể tải thông tin đề xuất');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBid();
  }, [loadBid]);

  const handleWithdraw = async () => {
    if (!id || !bid) return;
    if (!confirm('Bạn có chắc muốn rút đề xuất này?')) return;

    setIsWithdrawing(true);
    try {
      await bidsApi.withdrawBid(id);
      showToast('Đã rút đề xuất thành công', 'success');
      loadBid();
    } catch (err) {
      console.error('Failed to withdraw bid:', err);
      showToast('Không thể rút đề xuất. Vui lòng thử lại.', 'error');
    } finally {
      setIsWithdrawing(false);
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

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canWithdraw = bid?.status === 'PENDING' || bid?.status === 'APPROVED';
  const canEdit = bid?.status === 'PENDING';
  const isSelected = bid?.status === 'SELECTED';

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <i className="ri-loader-4-line spinner" style={{ fontSize: 32, color: '#f5d393' }} />
          <p style={{ color: '#a1a1aa', marginTop: 12 }}>Đang tải...</p>
        </div>
      </Layout>
    );
  }

  if (error || !bid) {
    return (
      <Layout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <i className="ri-error-warning-line" style={{ fontSize: 48, color: '#ef4444', marginBottom: 16 }} />
          <h2 style={{ color: '#e4e7ec', marginBottom: 8 }}>{error || 'Không tìm thấy đề xuất'}</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/contractor/my-bids')}>
            Quay lại danh sách
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 24 }}>
        {/* Breadcrumb - hidden in print */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}
          className="no-print"
        >
          <Link to="/contractor/my-bids" style={{ color: '#a1a1aa', textDecoration: 'none' }}>
            Đề xuất của tôi
          </Link>
          <i className="ri-arrow-right-s-line" style={{ color: '#71717a' }} />
          <span style={{ color: '#e4e7ec' }}>{bid.code}</span>
        </motion.div>

        {/* Header - hidden in print */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
          className="no-print"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span
                  className="badge"
                  style={{
                    background: `${STATUS_COLORS[bid.status]}20`,
                    color: STATUS_COLORS[bid.status],
                  }}
                >
                  {STATUS_LABELS[bid.status]}
                </span>
                <span style={{ fontSize: 13, color: '#71717a' }}>{bid.code}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec' }}>
                Chi tiết đề xuất
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Print Button - Requirement 27.2 */}
              <PrintButton
                label="In"
                documentTitle={`Đề xuất ${bid.code}`}
              />
              
              {canEdit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/contractor/marketplace/${bid.projectId}/bid?edit=${bid.id}`)}
                >
                  <i className="ri-edit-line" style={{ marginRight: 8 }} />
                  Chỉnh sửa
                </button>
              )}
              
              {canWithdraw && (
                <button
                  className="btn btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <i className="ri-loader-4-line spinner" />
                  ) : (
                    <>
                      <i className="ri-close-line" style={{ marginRight: 8 }} />
                      Rút đề xuất
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Print Header - only visible when printing */}
        <PrintHeader
          title={`Đề xuất ${bid.code}`}
          subtitle="Chi tiết đề xuất thầu"
          code={bid.code}
          showDate={true}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }} className="print-container">
          {/* Main Content */}
          <div>
            {/* Bid Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card avoid-break"
              style={{ padding: 20, marginBottom: 24 }}
            >
              <PrintSection title="Thông tin đề xuất">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Giá đề xuất</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f5d393' }}>
                      {formatCurrency(bid.price)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Thời gian thực hiện</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec' }}>
                      {bid.timeline}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Nội dung đề xuất</div>
                  <p style={{ color: '#a1a1aa', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {bid.proposal}
                  </p>
                </div>

                {/* Attachments */}
                {bid.attachments && bid.attachments.length > 0 && (
                  <div className="no-print">
                    <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Tài liệu đính kèm</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {bid.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 6,
                            color: '#f5d393',
                            textDecoration: 'none',
                            fontSize: 14,
                          }}
                        >
                          <i className="ri-file-line" />
                          {attachment.name}
                          <span style={{ color: '#71717a', fontSize: 12, marginLeft: 'auto' }}>
                            {(attachment.size / 1024).toFixed(1)} KB
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </PrintSection>
            </motion.div>

            {/* Project Info */}
            {bid.project && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card avoid-break"
                style={{ padding: 20, marginBottom: 24 }}
              >
                <PrintSection title="Thông tin dự án">
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
                      {bid.project.title}
                    </h3>
                    <span style={{ fontSize: 13, color: '#71717a' }}>{bid.project.code}</span>
                  </div>

                  <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 16 }}>
                    {bid.project.description}
                  </p>

                  <PrintInfoGrid
                    items={[
                      { label: 'Danh mục', value: bid.project.category?.name },
                      { label: 'Khu vực', value: bid.project.region?.name },
                      { label: 'Diện tích', value: bid.project.area ? `${bid.project.area} m²` : undefined },
                      { label: 'Ngân sách', value: bid.project.budgetMin && bid.project.budgetMax 
                        ? `${formatCurrency(bid.project.budgetMin)} - ${formatCurrency(bid.project.budgetMax)}`
                        : undefined 
                      },
                    ]}
                  />

                  {/* Project Images - hidden in print */}
                  {bid.project.images && bid.project.images.length > 0 && (
                    <div style={{ marginTop: 16 }} className="no-print">
                      <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Hình ảnh dự án</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                        {bid.project.images.slice(0, 4).map((img, idx) => (
                          <div key={idx} style={{ borderRadius: 6, overflow: 'hidden' }}>
                            <LazyImage
                              src={img}
                              alt={`Project image ${idx + 1}`}
                              aspectRatio="1/1"
                              objectFit="cover"
                              borderRadius={6}
                              showSkeleton={true}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </PrintSection>
              </motion.div>
            )}

            {/* Contact Info for Selected Bids - Requirements 10.4, 10.5 */}
            {isSelected && bid.project?.owner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card avoid-break contact-info-print"
                style={{
                  padding: 20,
                  marginBottom: 24,
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                }}
              >
                <PrintSection title="Thông tin chủ nhà">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 20,
                      }}
                    >
                      {bid.project.owner.name?.charAt(0) || 'H'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e4e7ec', fontSize: 16 }}>
                        {bid.project.owner.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#22c55e' }}>
                        Chủ dự án
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {bid.project.owner.email && (
                      <div>
                        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Email</div>
                        <a href={`mailto:${bid.project.owner.email}`} style={{ color: '#f5d393', textDecoration: 'none' }}>
                          {bid.project.owner.email}
                        </a>
                      </div>
                    )}
                    {bid.project.owner.phone && (
                      <div>
                        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Điện thoại</div>
                        <a href={`tel:${bid.project.owner.phone}`} style={{ color: '#f5d393', textDecoration: 'none' }}>
                          {bid.project.owner.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Full address shown after match */}
                  {bid.project.address && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>Địa chỉ công trình</div>
                      <div style={{ color: '#e4e7ec' }}>{bid.project.address}</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }} className="no-print">
                    <button className="btn btn-primary" style={{ flex: 1 }}>
                      <i className="ri-chat-1-line" style={{ marginRight: 8 }} />
                      Nhắn tin
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1 }}>
                      <i className="ri-phone-line" style={{ marginRight: 8 }} />
                      Gọi điện
                    </button>
                  </div>
                </PrintSection>
              </motion.div>
            )}

            {/* Rejection Note */}
            {bid.status === 'REJECTED' && bid.reviewNote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card avoid-break"
                style={{
                  padding: 20,
                  marginBottom: 24,
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
                  <i className="ri-error-warning-line" style={{ marginRight: 8 }} />
                  Lý do từ chối
                </h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.5 }}>{bid.reviewNote}</p>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card avoid-break"
              style={{ padding: 20, marginBottom: 20 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                Trạng thái
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#71717a' }}>Trạng thái</span>
                  <span
                    className="badge"
                    style={{
                      background: `${STATUS_COLORS[bid.status]}20`,
                      color: STATUS_COLORS[bid.status],
                    }}
                  >
                    {STATUS_LABELS[bid.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#71717a' }}>Ngày gửi</span>
                  <span style={{ color: '#e4e7ec' }}>{formatDate(bid.createdAt)}</span>
                </div>
                {bid.reviewedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Ngày duyệt</span>
                    <span style={{ color: '#e4e7ec' }}>{formatDate(bid.reviewedAt)}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Win Fee Info for Selected Bids */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card avoid-break escrow-info-print"
                style={{ padding: 20, marginBottom: 20 }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                  Phí thắng thầu
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Giá đề xuất</span>
                    <span style={{ color: '#e4e7ec' }}>{formatCurrency(bid.price)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#71717a' }}>Phí (5%)</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      {formatCurrency(bid.price * 0.05)}
                    </span>
                  </div>
                </div>
                
                <p style={{ fontSize: 12, color: '#71717a', marginTop: 12, lineHeight: 1.5 }}>
                  Phí thắng thầu sẽ được thanh toán sau khi hoàn thành dự án.
                </p>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card avoid-break"
              style={{ padding: 20 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
                Lịch sử
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#f5d393',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, color: '#e4e7ec' }}>Đã gửi đề xuất</div>
                    <div style={{ fontSize: 12, color: '#71717a' }}>{formatDateTime(bid.createdAt)}</div>
                  </div>
                </div>
                
                {bid.reviewedAt && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: bid.status === 'REJECTED' ? '#ef4444' : '#3b82f6',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, color: '#e4e7ec' }}>
                        {bid.status === 'REJECTED' ? 'Bị từ chối' : 'Đã được duyệt'}
                      </div>
                      <div style={{ fontSize: 12, color: '#71717a' }}>{formatDateTime(bid.reviewedAt)}</div>
                    </div>
                  </div>
                )}
                
                {isSelected && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#22c55e',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>
                        Được chọn thắng thầu
                      </div>
                      <div style={{ fontSize: 12, color: '#71717a' }}>
                        Chúc mừng! Bạn đã được chọn.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Print Footer - only visible when printing */}
        <PrintFooter
          text="Tài liệu này chỉ có giá trị tham khảo. Vui lòng liên hệ để xác nhận thông tin."
        />
      </div>
    </Layout>
  );
}
