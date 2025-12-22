/**
 * Quotes Tab - View and manage interior quotes
 * Task 29.1: Full implementation with table and detail modal
 * Requirements: 17.1-17.6
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';
import { interiorQuotesApi } from '../../api';
import type { QuoteListItem, InteriorQuote, QuoteStatus } from '../../types';

const QUOTE_STATUSES: { value: QuoteStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Nháp', color: tokens.color.muted },
  { value: 'SENT', label: 'Đã gửi', color: tokens.color.info },
  { value: 'VIEWED', label: 'Đã xem', color: tokens.color.primary },
  { value: 'ACCEPTED', label: 'Chấp nhận', color: tokens.color.success },
  { value: 'REJECTED', label: 'Từ chối', color: tokens.color.error },
  { value: 'EXPIRED', label: 'Hết hạn', color: tokens.color.warning },
];

// ========== QUOTE DETAIL MODAL ==========

interface QuoteDetailModalProps {
  quoteId: string;
  onClose: () => void;
  onStatusChange: () => void;
}

function QuoteDetailModal({ quoteId, onClose, onStatusChange }: QuoteDetailModalProps) {
  const [quote, setQuote] = useState<InteriorQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      setLoading(true);
      try {
        const data = await interiorQuotesApi.get(quoteId);
        setQuote(data);
      } catch (err) {
        console.error('Failed to load quote:', err);
      } finally {
        setLoading(false);
      }
    };
    loadQuote();
  }, [quoteId]);

  const handleStatusChange = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    setUpdating(true);
    try {
      await interiorQuotesApi.updateStatus(quote.id, newStatus);
      setQuote((prev) => prev ? { ...prev, status: newStatus } : null);
      onStatusChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusInfo = (status: QuoteStatus) => QUOTE_STATUSES.find((s) => s.value === status) || QUOTE_STATUSES[0];

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998 }} />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          pointerEvents: 'none',
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 'min(700px, 95vw)', maxHeight: '90vh', overflow: 'auto', background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, pointerEvents: 'auto' }}
        >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.color.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: tokens.color.surface, zIndex: 1 }}>
          <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
            Chi tiết Báo giá {quote?.code}
          </h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} style={{ background: 'transparent', border: 'none', color: tokens.color.muted, cursor: 'pointer', padding: 4 }}>
            <i className="ri-close-line" style={{ fontSize: 20 }} />
          </motion.button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: tokens.color.muted }} />
          </div>
        ) : quote ? (
          <div style={{ padding: 20 }}>
            {/* Status & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: tokens.color.muted, fontSize: 13 }}>Trạng thái:</span>
                <span style={{ padding: '6px 12px', borderRadius: tokens.radius.sm, background: `${getStatusInfo(quote.status).color}20`, color: getStatusInfo(quote.status).color, fontSize: 13, fontWeight: 500 }}>
                  {getStatusInfo(quote.status).label}
                </span>
              </div>
              <select
                value={quote.status}
                onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
                disabled={updating}
                style={{ padding: '8px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none', cursor: updating ? 'not-allowed' : 'pointer' }}
              >
                {QUOTE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-user-line" style={{ marginRight: 8 }} />
                Thông tin khách hàng
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Họ tên</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.customerName}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Điện thoại</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.customerPhone}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Email</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.customerEmail || '-'}</div>
                </div>
              </div>
            </div>

            {/* Unit Info */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-building-line" style={{ marginRight: 8 }} />
                Thông tin căn hộ
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Dự án</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.developmentName}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Tòa nhà</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.buildingName}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Mã căn hộ</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.unitCode}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Loại căn</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.unitType}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Layout</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.layoutName}</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md }}>
                  <div style={{ color: tokens.color.muted, fontSize: 11, marginBottom: 4 }}>Diện tích</div>
                  <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{quote.grossArea} m² (thông thủy: {quote.netArea} m²)</div>
                </div>
              </div>
            </div>

            {/* Package Info */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-gift-line" style={{ marginRight: 8 }} />
                Gói nội thất
              </h4>
              <div style={{ padding: 16, background: `${tokens.color.primary}10`, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.primary}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>{quote.packageName}</div>
                    <div style={{ color: tokens.color.muted, fontSize: 12, marginTop: 4 }}>Tier {quote.packageTier}</div>
                  </div>
                  <div style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 600 }}>
                    {quote.packagePrice.toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px', color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>
                <i className="ri-money-dollar-circle-line" style={{ marginRight: 8 }} />
                Chi tiết giá
              </h4>
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <span style={{ color: tokens.color.muted, fontSize: 13 }}>Giá gói nội thất</span>
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.packagePrice.toLocaleString('vi-VN')} đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <span style={{ color: tokens.color.muted, fontSize: 13 }}>Chi phí nhân công</span>
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.laborCost.toLocaleString('vi-VN')} đ</span>
                </div>
                {quote.surchargesTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>Phụ phí</span>
                    <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.surchargesTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {quote.managementFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>Phí quản lý</span>
                    <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.managementFee.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {quote.contingency > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>Chi phí dự phòng</span>
                    <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.contingency.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                  <span style={{ color: tokens.color.muted, fontSize: 13 }}>Tạm tính</span>
                  <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.subtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {quote.vatAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>VAT (10%)</span>
                    <span style={{ color: tokens.color.text, fontSize: 13 }}>{quote.vatAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {quote.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${tokens.color.border}` }}>
                    <span style={{ color: tokens.color.muted, fontSize: 13 }}>Giảm giá</span>
                    <span style={{ color: tokens.color.success, fontSize: 13 }}>-{quote.discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: `${tokens.color.primary}10` }}>
                  <span style={{ color: tokens.color.text, fontSize: 14, fontWeight: 600 }}>Tổng cộng</span>
                  <span style={{ color: tokens.color.primary, fontSize: 16, fontWeight: 700 }}>{quote.grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {quote.pricePerSqm && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}>
                    <span style={{ color: tokens.color.muted, fontSize: 12 }}>Giá/m²</span>
                    <span style={{ color: tokens.color.muted, fontSize: 12 }}>{quote.pricePerSqm.toLocaleString('vi-VN')} đ/m²</span>
                  </div>
                )}
              </div>
            </div>

            {/* Validity */}
            {quote.validUntil && (
              <div style={{ padding: 12, background: `${tokens.color.warning}10`, borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.warning}30`, fontSize: 13, color: tokens.color.warning }}>
                <i className="ri-time-line" style={{ marginRight: 8 }} />
                Báo giá có hiệu lực đến: {new Date(quote.validUntil).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: tokens.color.error }}>
            Không tìm thấy báo giá
          </div>
        )}
        </motion.div>
      </div>
    </>
  );
}



// ========== MAIN COMPONENT ==========

export function QuotesTab() {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const ITEMS_PER_PAGE = 10;

  // Load quotes
  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await interiorQuotesApi.list({
        status: statusFilter || undefined,
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit: ITEMS_PER_PAGE,
      });
      setQuotes(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách báo giá');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, fromDate, toDate, page]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search, fromDate, toDate]);

  const getStatusInfo = (status: QuoteStatus) => QUOTE_STATUSES.find((s) => s.value === status) || QUOTE_STATUSES[0];
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Export handler
  const handleExport = () => {
    const url = interiorQuotesApi.export({
      status: statusFilter || undefined,
      search: search || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: tokens.color.text, fontSize: 16, fontWeight: 600 }}>
          <i className="ri-file-list-3-line" style={{ marginRight: 8 }} />
          Lịch sử Báo giá ({total})
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: `${tokens.color.success}20`,
            border: `1px solid ${tokens.color.success}40`,
            borderRadius: tokens.radius.md,
            color: tokens.color.success,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <i className="ri-download-line" style={{ fontSize: 16 }} />
          Xuất CSV
        </motion.button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: tokens.color.muted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã, tên, SĐT..."
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | '')}
          style={{ padding: '8px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none', minWidth: 120 }}
        >
          <option value="">Tất cả trạng thái</option>
          {QUOTE_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: tokens.radius.md, border: `1px solid ${tokens.color.border}`, background: tokens.color.background, color: tokens.color.text, fontSize: 13, outline: 'none' }}
        />
      </div>

      {/* Content */}
      <div style={{ background: tokens.color.surface, borderRadius: tokens.radius.lg, border: `1px solid ${tokens.color.border}`, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <motion.i className="ri-loader-4-line" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-error-warning-line" style={{ fontSize: 48, color: tokens.color.error }} />
            <p style={{ color: tokens.color.error, marginTop: 12 }}>{error}</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={loadQuotes} style={{ marginTop: 12, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, color: tokens.color.text, cursor: 'pointer' }}>
              Thử lại
            </motion.button>
          </div>
        ) : quotes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <i className="ri-file-list-3-line" style={{ fontSize: 48, color: tokens.color.muted }} />
            <p style={{ color: tokens.color.muted, marginTop: 12 }}>Chưa có báo giá nào</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Mã</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Khách hàng</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Căn hộ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Gói</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Tổng tiền</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Ngày tạo</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.muted, fontSize: 12, fontWeight: 500 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} style={{ borderBottom: `1px solid ${tokens.color.border}` }}>
                  <td style={{ padding: '12px 16px', color: tokens.color.primary, fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>{q.code}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>{q.customerName}</div>
                    <div style={{ color: tokens.color.muted, fontSize: 11 }}>{q.customerPhone}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: tokens.color.text, fontSize: 13 }}>{q.unitCode}</div>
                    <div style={{ color: tokens.color.muted, fontSize: 11 }}>{q.developmentName}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: tokens.color.text, fontSize: 13 }}>{q.packageName}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: tokens.color.primary, fontSize: 13, fontWeight: 600 }}>{q.grandTotal.toLocaleString('vi-VN')} đ</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '4px 8px', borderRadius: tokens.radius.sm, background: `${getStatusInfo(q.status).color}20`, color: getStatusInfo(q.status).color, fontSize: 11, fontWeight: 500 }}>
                      {getStatusInfo(q.status).label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: tokens.color.muted, fontSize: 12 }}>{new Date(q.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedQuoteId(q.id)}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${tokens.color.primary}20`, border: 'none', borderRadius: tokens.radius.sm, color: tokens.color.primary, cursor: 'pointer' }}
                    >
                      <i className="ri-eye-line" style={{ fontSize: 14 }} />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.color.muted, fontSize: 13 }}>
            Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} / {total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: page === 1 ? tokens.color.muted : tokens.color.text, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              <i className="ri-arrow-left-s-line" />
            </motion.button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <motion.button
                  key={pageNum}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPage(pageNum)}
                  style={{ padding: '6px 12px', background: page === pageNum ? tokens.color.primary : 'transparent', border: `1px solid ${page === pageNum ? tokens.color.primary : tokens.color.border}`, borderRadius: tokens.radius.sm, color: page === pageNum ? '#111' : tokens.color.text, fontSize: 13, fontWeight: page === pageNum ? 600 : 400, cursor: 'pointer' }}
                >
                  {pageNum}
                </motion.button>
              );
            })}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, color: page === totalPages ? tokens.color.muted : tokens.color.text, fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
            >
              <i className="ri-arrow-right-s-line" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedQuoteId && (
          <QuoteDetailModal
            quoteId={selectedQuoteId}
            onClose={() => setSelectedQuoteId(null)}
            onStatusChange={loadQuotes}
          />
        )}
      </AnimatePresence>
    </div>
  );
}