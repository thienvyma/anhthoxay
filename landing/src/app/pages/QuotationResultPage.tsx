/**
 * QuotationResultPage - Full page display for furniture quotation result
 * Styled to match PDF layout exactly with professional design
 * Feature: furniture-quotation
 * Requirements: 8.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tokens, API_URL } from '@app/shared';

// ============================================
// TYPES
// ============================================

/**
 * Quotation item with material and Fit-in support
 * 
 * **Feature: furniture-product-mapping**
 * **Validates: Requirements 8.3, 8.5**
 */
interface QuotationItem {
  productId: string;
  name: string;
  material?: string;              // Material variant
  price: number;                  // Base price (calculatedPrice)
  quantity: number;
  fitInSelected?: boolean;        // Whether Fit-in is selected
  fitInFee?: number;              // Fit-in fee amount (if selected)
}

interface QuotationFee {
  name: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  amount: number;
}

interface FurnitureQuotation {
  id: string;
  leadId: string;
  developerName: string;
  projectName: string;
  buildingName: string;
  buildingCode: string;
  floor: number;
  axis: number;
  unitNumber: string;
  apartmentType: string;
  layoutImageUrl: string | null;
  items: string;
  basePrice: number;
  fees: string;
  totalPrice: number;
  createdAt: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ============================================
// MAIN COMPONENT
// ============================================

export function QuotationResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quotation, setQuotation] = useState<FurnitureQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch quotation data
  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy mã báo giá');
      setLoading(false);
      return;
    }

    // Try to get from sessionStorage first (passed from form)
    const cached = sessionStorage.getItem(`quotation_${id}`);
    if (cached) {
      try {
        setQuotation(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // Continue to fetch from API
      }
    }

    // Fetch from API (for direct URL access or refresh)
    fetch(`${API_URL}/api/furniture/quotations/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy báo giá');
        return res.json();
      })
      .then((json) => {
        const data = json.data || json;
        setQuotation(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Parse JSON fields
  const items: QuotationItem[] = useMemo(() => {
    if (!quotation) return [];
    try {
      return typeof quotation.items === 'string' 
        ? JSON.parse(quotation.items) 
        : (quotation.items || []);
    } catch {
      return [];
    }
  }, [quotation]);

  const fees: QuotationFee[] = useMemo(() => {
    if (!quotation) return [];
    try {
      return typeof quotation.fees === 'string' 
        ? JSON.parse(quotation.fees) 
        : (quotation.fees || []);
    } catch {
      return [];
    }
  }, [quotation]);

  // Calculate total Fit-in fees from items
  const fitInFeesTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.fitInSelected && item.fitInFee) {
        return sum + (item.fitInFee * item.quantity);
      }
      return sum;
    }, 0);
  }, [items]);

  // Handle PDF download
  const handleDownloadPdf = useCallback(async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      const response = await fetch(`${API_URL}/api/furniture/quotations/${id}/pdf`);
      if (!response.ok) throw new Error('Không thể tải PDF');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'bao-gia.pdf';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể tải PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }, [id]);

  // Handle new quotation
  const handleNewQuotation = useCallback(() => {
    navigate('/bao-gia');
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.color.background,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            borderWidth: '4px',
            borderStyle: 'solid',
            borderColor: `${tokens.color.border} ${tokens.color.border} ${tokens.color.border} ${tokens.color.primary}`,
          }}
        />
      </div>
    );
  }

  // Error state
  if (error || !quotation) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tokens.color.background,
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <i
            className="ri-error-warning-line"
            style={{ fontSize: '4rem', color: tokens.color.warning, marginBottom: '1rem', display: 'block' }}
          />
          <h2 style={{ color: tokens.color.text, marginBottom: '0.5rem' }}>
            {error || 'Không tìm thấy báo giá'}
          </h2>
          <p style={{ color: tokens.color.muted, marginBottom: '1.5rem' }}>
            Báo giá có thể đã hết hạn hoặc không tồn tại
          </p>
          <button
            onClick={handleNewQuotation}
            style={{
              padding: '0.875rem 2rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: tokens.color.primary,
              color: '#111',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tạo báo giá mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: tokens.color.background,
        paddingTop: '100px',
        paddingBottom: '3rem',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 1rem' }}>
        {/* PDF-like Document */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#FFFFFF',
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
            boxShadow: tokens.shadow.lg,
          }}
        >

          {/* ============================================ */}
          {/* HEADER - Company & Document Info */}
          {/* ============================================ */}
          <div
            style={{
              padding: '2rem',
              borderBottom: '1px solid #E0E0E0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#F5D393',
                  fontFamily: tokens.font.display,
                }}
              >
                ANH THỢ XÂY
              </h1>
              <h2
                style={{
                  margin: '0.5rem 0 0',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#333333',
                }}
              >
                BÁO GIÁ NỘI THẤT
              </h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666666' }}>
                Ngày: {formatDate(quotation.createdAt)}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#666666' }}>
                Mã: {quotation.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* ============================================ */}
          {/* APARTMENT INFO SECTION */}
          {/* ============================================ */}
          <div style={{ padding: '2rem', borderBottom: '1px solid #E0E0E0' }}>
            <h3
              style={{
                margin: '0 0 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#F5D393',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              THÔNG TIN CĂN HỘ
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                  Chủ đầu tư:
                </span>
                <span style={{ fontWeight: 500, color: '#333333' }}>
                  {quotation.developerName}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                  Dự án:
                </span>
                <span style={{ fontWeight: 500, color: '#333333' }}>
                  {quotation.projectName}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                  Tòa nhà:
                </span>
                <span style={{ fontWeight: 500, color: '#333333' }}>
                  {quotation.buildingName}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                  Số căn hộ:
                </span>
                <span style={{ fontWeight: 500, color: '#333333' }}>
                  {quotation.unitNumber}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#666666', display: 'block' }}>
                  Loại căn hộ:
                </span>
                <span style={{ fontWeight: 500, color: '#333333' }}>
                  {quotation.apartmentType.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SELECTION TYPE SECTION */}
          {/* ============================================ */}
          <div style={{ padding: '2rem', borderBottom: '1px solid #E0E0E0' }}>
            <h3
              style={{
                margin: '0 0 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#F5D393',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              LOẠI LỰA CHỌN
            </h3>
            <p style={{ margin: 0, fontWeight: 500, color: '#333333' }}>
              Tùy chọn sản phẩm ({items.length} sản phẩm)
            </p>
          </div>

          {/* ============================================ */}
          {/* ITEMS TABLE SECTION */}
          {/* ============================================ */}
          {items.length > 0 && (
            <div style={{ padding: '2rem', borderBottom: '1px solid #E0E0E0' }}>
              <h3
                style={{
                  margin: '0 0 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#F5D393',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                SẢN PHẨM ĐÃ CHỌN
              </h3>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E0E0E0' }}>
                      <th
                        style={{
                          padding: '0.75rem 0',
                          textAlign: 'left',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666666',
                        }}
                      >
                        Sản phẩm
                      </th>
                      <th
                        style={{
                          padding: '0.75rem 0',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666666',
                          width: '60px',
                        }}
                      >
                        SL
                      </th>
                      <th
                        style={{
                          padding: '0.75rem 0',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666666',
                          width: '120px',
                        }}
                      >
                        Đơn giá
                      </th>
                      <th
                        style={{
                          padding: '0.75rem 0',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666666',
                          width: '100px',
                        }}
                      >
                        Fit-in
                      </th>
                      <th
                        style={{
                          padding: '0.75rem 0',
                          textAlign: 'right',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: '#666666',
                          width: '120px',
                        }}
                      >
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const itemTotal = item.price * item.quantity;
                      const fitInTotal = item.fitInSelected && item.fitInFee ? item.fitInFee * item.quantity : 0;
                      const totalWithFitIn = itemTotal + fitInTotal;
                      
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #E0E0E0' }}>
                          <td style={{ padding: '0.75rem 0', color: '#333333' }}>
                            <div>
                              {item.name}
                              {item.material && (
                                <span style={{ 
                                  display: 'block', 
                                  fontSize: '0.75rem', 
                                  color: '#666666',
                                  marginTop: '0.25rem'
                                }}>
                                  Chất liệu: {item.material}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'right', color: '#333333' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'right', color: '#666666' }}>
                            {formatCurrency(item.price)}
                          </td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'right', color: '#666666' }}>
                            {item.fitInSelected && item.fitInFee ? (
                              <span style={{ color: '#F5D393', fontWeight: 500 }}>
                                +{formatCurrency(item.fitInFee)}
                              </span>
                            ) : (
                              <span style={{ color: '#999999' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600, color: '#333333' }}>
                            {formatCurrency(totalWithFitIn)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* PRICE BREAKDOWN SECTION */}
          {/* ============================================ */}
          <div style={{ padding: '2rem', borderBottom: '1px solid #E0E0E0' }}>
            <h3
              style={{
                margin: '0 0 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#F5D393',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              CHI TIẾT GIÁ
            </h3>

            <div style={{ maxWidth: '350px', marginLeft: 'auto' }}>
              {/* Base Price */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                }}
              >
                <span style={{ color: '#666666' }}>Giá cơ bản:</span>
                <span style={{ color: '#333333' }}>
                  {formatCurrency(quotation.basePrice)}
                </span>
              </div>

              {/* Fit-in Fees Total */}
              {fitInFeesTotal > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                  }}
                >
                  <span style={{ color: '#666666' }}>Phí Fit-in:</span>
                  <span style={{ color: '#F5D393', fontWeight: 500 }}>
                    {formatCurrency(fitInFeesTotal)}
                  </span>
                </div>
              )}

              {/* Fees */}
              {fees.map((fee, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                  }}
                >
                  <span style={{ color: '#666666' }}>
                    {fee.name}
                    {fee.type === 'PERCENTAGE' && ` (${fee.value}%)`}:
                  </span>
                  <span style={{ color: '#333333' }}>
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '1rem 0 0',
                  marginTop: '0.5rem',
                  borderTop: '2px solid #F5D393',
                }}
              >
                <span style={{ fontWeight: 700, color: '#F5D393', fontSize: '1rem' }}>
                  TỔNG CỘNG:
                </span>
                <span style={{ fontWeight: 700, color: '#F5D393', fontSize: '1.5rem' }}>
                  {formatCurrency(quotation.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* FOOTER NOTE */}
          {/* ============================================ */}
          <div
            style={{
              padding: '1.5rem 2rem',
              background: '#F5F5F5',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#666666' }}>
              Báo giá này chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo thời điểm và điều kiện cụ thể.
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#666666' }}>
              © ANH THỢ XÂY - Đối tác tin cậy cho ngôi nhà của bạn
            </p>
          </div>
        </motion.div>

        {/* ============================================ */}
        {/* ACTION BUTTONS */}
        {/* ============================================ */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            style={{
              padding: '1rem 2rem',
              borderRadius: tokens.radius.md,
              border: 'none',
              background: tokens.color.primary,
              color: '#111',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: downloadingPdf ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: downloadingPdf ? 0.7 : 1,
            }}
          >
            {downloadingPdf ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  <i className="ri-loader-4-line" />
                </motion.span>
                Đang tải...
              </>
            ) : (
              <>
                <i className="ri-file-pdf-line" /> Tải PDF
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.print()}
            style={{
              padding: '1rem 2rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: tokens.color.text,
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="ri-printer-line" /> In báo giá
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewQuotation}
            style={{
              padding: '1rem 2rem',
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.color.border}`,
              background: 'transparent',
              color: tokens.color.text,
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <i className="ri-refresh-line" /> Báo giá mới
          </motion.button>
        </div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: `${tokens.color.success}15`,
            borderRadius: tokens.radius.md,
            border: `1px solid ${tokens.color.success}30`,
            textAlign: 'center',
          }}
        >
          <i
            className="ri-checkbox-circle-fill"
            style={{ fontSize: '1.5rem', color: tokens.color.success, marginBottom: '0.5rem', display: 'block' }}
          />
          <p style={{ margin: 0, fontWeight: 600, color: tokens.color.text }}>
            Báo giá đã được tạo thành công!
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: tokens.color.muted }}>
            Chúng tôi sẽ liên hệ với bạn sớm nhất
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default QuotationResultPage;
