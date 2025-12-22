/**
 * Contractor Bid Creation Page
 *
 * Displays:
 * - Project summary at top (Requirement 11.1)
 * - Price and timeline inputs (Requirement 11.2)
 * - Proposal textarea (min 100 chars) (Requirement 11.3)
 * - File attachments (max 5) (Requirement 11.4)
 * - Win fee calculation preview (Requirement 11.5)
 *
 * Auto-save functionality:
 * - Auto-saves draft every 30 seconds (Requirement 22.2)
 * - Restores draft on return (Requirement 22.3)
 * - Cleans up draft on successful submission (Requirement 22.5)
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 22.2, 22.3, 22.5**
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Layout } from '../../components/Layout';
import { useToast } from '../../components/Toast';
import { DraftRecoveryModal } from '../../components/DraftRecoveryModal';
import { useDraft } from '../../hooks/useDraft';
import { DRAFT_KEYS } from '../../services/draftStorage';
import {
  marketplaceApi,
  bidsApi,
  settingsApi,
  mediaApi,
  type Project,
  type Bid,
  type BiddingSettings,
  type Attachment,
} from '../../api';

const MIN_PROPOSAL_LENGTH = 50;
const MAX_ATTACHMENTS = 5;
const MAX_PRICE = 100000000000; // 100 tỷ VNĐ

// Form data type for draft storage
interface BidFormData {
  price: string;
  timeline: string;
  proposal: string;
  attachments: Attachment[];
}

const INITIAL_BID_FORM_DATA: BidFormData = {
  price: '',
  timeline: '',
  proposal: '',
  attachments: [],
};

export function CreateBidPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const editBidId = searchParams.get('edit');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [existingBid, setExistingBid] = useState<Bid | null>(null);
  const [settings, setSettings] = useState<BiddingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Form state
  const [price, setPrice] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  const [proposal, setProposal] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check verification status
  const isVerified = user?.verificationStatus === 'VERIFIED';

  // Draft auto-save hook - Requirements 22.2, 22.3, 22.5
  const draftKey = projectId ? DRAFT_KEYS.BID(projectId) : 'bid_unknown';
  const {
    isExpired,
    draftInfo,
    isAutoSaving,
    lastSavedText,
    save: saveDraft,
    clear: clearDraft,
    showRecoveryModal,
    handleContinueDraft: handleContinueDraftBase,
    handleStartFresh: handleStartFreshBase,
  } = useDraft<BidFormData>({
    draftKey,
    initialData: INITIAL_BID_FORM_DATA,
    onRestore: (data) => {
      setPrice(data.price);
      setTimeline(data.timeline);
      setProposal(data.proposal);
      setAttachments(data.attachments);
    },
    // Don't auto-save if editing existing bid
    autoSaveEnabled: !editBidId,
  });

  // Wrap handlers to not show modal when editing
  const handleContinueDraft = () => {
    if (!editBidId) {
      handleContinueDraftBase();
    }
  };

  const handleStartFresh = () => {
    if (!editBidId) {
      handleStartFreshBase();
    }
  };

  // Auto-save form data when it changes
  useEffect(() => {
    if (!editBidId && projectId) {
      const formData: BidFormData = { price, timeline, proposal, attachments };
      // Only save if there's some data
      if (price || timeline || proposal || attachments.length > 0) {
        saveDraft(formData);
      }
    }
  }, [price, timeline, proposal, attachments, editBidId, projectId, saveDraft]);


  useEffect(() => {
    loadData();
  }, [projectId, editBidId]);

  const loadData = async () => {
    if (!projectId) {
      navigate('/contractor/marketplace');
      return;
    }

    setIsLoading(true);
    try {
      // Load project, settings, and existing bid (if editing)
      const [projectData, settingsData] = await Promise.all([
        marketplaceApi.getProject(projectId),
        settingsApi.getBiddingSettings(),
      ]);

      setProject(projectData);
      setSettings(settingsData);

      // If editing, load existing bid
      if (editBidId) {
        const bidData = await bidsApi.getBid(editBidId);
        setExistingBid(bidData);
        setPrice(bidData.price.toString());
        setTimeline(bidData.timeline);
        setProposal(bidData.proposal);
        setAttachments(bidData.attachments || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Không thể tải thông tin dự án', 'error');
      navigate('/contractor/marketplace');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      newErrors.price = 'Vui lòng nhập giá đề xuất hợp lệ';
    } else if (priceNum > MAX_PRICE) {
      newErrors.price = 'Giá đề xuất không được vượt quá 100 tỷ VNĐ';
    }

    if (!timeline.trim()) {
      newErrors.timeline = 'Vui lòng nhập thời gian thực hiện';
    }

    if (!proposal.trim()) {
      newErrors.proposal = 'Vui lòng nhập nội dung đề xuất';
    } else if (proposal.trim().length < MIN_PROPOSAL_LENGTH) {
      newErrors.proposal = `Nội dung đề xuất phải có ít nhất ${MIN_PROPOSAL_LENGTH} ký tự`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !projectId) return;

    setIsSubmitting(true);
    try {
      const bidData = {
        projectId,
        price: parseFloat(price),
        timeline: timeline.trim(),
        proposal: proposal.trim(),
        attachments,
      };

      if (editBidId && existingBid) {
        await bidsApi.updateBid(editBidId, {
          price: bidData.price,
          timeline: bidData.timeline,
          proposal: bidData.proposal,
          attachments: bidData.attachments,
        });
        showToast('Đã cập nhật đề xuất thành công', 'success');
      } else {
        await bidsApi.createBid(bidData);
        showToast('Đã gửi đề xuất thành công', 'success');
      }

      // Clear draft on successful submission - Requirement 22.5
      clearDraft();

      navigate('/contractor/my-bids');
    } catch (error: unknown) {
      console.error('Failed to submit bid:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Không thể gửi đề xuất. Vui lòng thử lại.';
      if (error instanceof Error) {
        // Check for specific error codes
        if (error.message.includes('CONTRACTOR_NOT_VERIFIED')) {
          errorMessage = 'Bạn cần được xác minh để gửi đề xuất';
        } else if (error.message.includes('BID_PROJECT_NOT_OPEN')) {
          errorMessage = 'Công trình không còn nhận đề xuất';
        } else if (error.message.includes('BID_DEADLINE_PASSED')) {
          errorMessage = 'Đã hết hạn nhận đề xuất';
        } else if (error.message.includes('BID_MAX_REACHED')) {
          errorMessage = 'Công trình đã đủ số lượng đề xuất';
        } else if (error.message.includes('BID_ALREADY_EXISTS')) {
          errorMessage = 'Bạn đã gửi đề xuất cho công trình này';
        } else if (error.message.includes('Invalid request data')) {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        } else {
          errorMessage = error.message;
        }
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      showToast(`Chỉ được đính kèm tối đa ${MAX_ATTACHMENTS} tệp`, 'error');
      return;
    }

    setUploadingFiles(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await mediaApi.upload(file, 'bids');
        return {
          name: file.name,
          url: result.url,
          type: file.type,
          size: file.size,
        };
      });

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...newAttachments]);
      showToast('Đã tải lên tệp đính kèm', 'success');
    } catch (error) {
      console.error('Failed to upload files:', error);
      showToast('Không thể tải lên tệp. Vui lòng thử lại.', 'error');
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate win fee - Requirement 11.5
  const calculateWinFee = (): number => {
    if (!settings || !price) return 0;
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) return 0;
    const winFeePercentage = settings.winFeePercentage ?? 0;
    if (isNaN(winFeePercentage)) return 0;
    return (priceNum * winFeePercentage) / 100;
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <i className="ri-loader-4-line spinner" style={{ fontSize: 32, color: '#f5d393' }} />
          <p style={{ color: '#a1a1aa', marginTop: 16 }}>Đang tải...</p>
        </div>
      </Layout>
    );
  }

  if (!isVerified) {
    return (
      <Layout>
        <div style={{ padding: 24 }}>
          <div
            className="card"
            style={{ padding: 60, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}
          >
            <i
              className="ri-shield-check-line"
              style={{ fontSize: 48, color: '#f59e0b', marginBottom: 16, display: 'block' }}
            />
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#e4e7ec', marginBottom: 8 }}>
              Cần xác minh tài khoản
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: 24 }}>
              Bạn cần hoàn thiện hồ sơ và được xác minh để có thể gửi đề xuất.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/contractor/profile')}
            >
              Xác minh ngay
            </button>
          </div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      {/* Draft Recovery Modal - Requirements 22.3, 22.4 */}
      {!editBidId && (
        <DraftRecoveryModal
          isOpen={showRecoveryModal}
          savedAt={draftInfo?.savedAt || null}
          isExpired={isExpired}
          onContinue={handleContinueDraft}
          onStartFresh={handleStartFresh}
        />
      )}

      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 16,
              padding: 0,
            }}
          >
            <i className="ri-arrow-left-line" />
            Quay lại
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 4 }}>
                {editBidId ? 'Chỉnh sửa đề xuất' : 'Gửi đề xuất'}
              </h1>
              <p style={{ color: '#a1a1aa', fontSize: 14 }}>
                {editBidId
                  ? 'Cập nhật thông tin đề xuất của bạn'
                  : 'Điền thông tin để gửi đề xuất cho dự án này'}
              </p>
            </div>
            {/* Auto-save indicator - only show when not editing */}
            {!editBidId && (isAutoSaving || lastSavedText) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#71717a',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 6,
                }}
              >
                {isAutoSaving ? (
                  <>
                    <i className="ri-loader-4-line spinner" style={{ fontSize: 14 }} />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-check-line" style={{ fontSize: 14, color: '#22c55e' }} />
                    <span>Đã lưu {lastSavedText}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Project Summary - Requirement 11.1 */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ padding: 20, marginBottom: 24 }}
          >
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
                style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
              >
                {project.code}
              </span>
              <span style={{ fontSize: 12, color: '#71717a' }}>
                {project.bidCount || 0}/{project.maxBids || 20} đề xuất
              </span>
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#e4e7ec',
                marginBottom: 8,
              }}
            >
              {project.title}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#a1a1aa',
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {project.description}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Khu vực</div>
                <div style={{ fontSize: 14, color: '#e4e7ec' }}>
                  {project.region?.name || 'Chưa xác định'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Hạng mục</div>
                <div style={{ fontSize: 14, color: '#e4e7ec' }}>
                  {project.category?.name || 'Chưa xác định'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Ngân sách</div>
                <div style={{ fontSize: 14, color: '#f5d393' }}>
                  {project.budgetMin && project.budgetMax
                    ? `${formatCurrency(project.budgetMin)} - ${formatCurrency(project.budgetMax)}`
                    : 'Thương lượng'}
                </div>
              </div>
              {project.area && (
                <div>
                  <div style={{ fontSize: 11, color: '#71717a', marginBottom: 2 }}>Diện tích</div>
                  <div style={{ fontSize: 14, color: '#e4e7ec' }}>{project.area} m²</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Bid Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
        >
          {/* Price and Timeline - Requirement 11.2 */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
              Thông tin đề xuất
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#e4e7ec',
                    marginBottom: 8,
                  }}
                >
                  Giá đề xuất (VNĐ) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Nhập giá đề xuất"
                  className="input"
                  style={{ borderColor: errors.price ? '#ef4444' : undefined }}
                />
                {errors.price && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.price}</p>
                )}
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#e4e7ec',
                    marginBottom: 8,
                  }}
                >
                  Thời gian thực hiện <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="VD: 2 tuần, 1 tháng"
                  className="input"
                  style={{ borderColor: errors.timeline ? '#ef4444' : undefined }}
                />
                {errors.timeline && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{errors.timeline}</p>
                )}
              </div>
            </div>
          </div>


          {/* Proposal - Requirement 11.3 */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
              Nội dung đề xuất
            </h3>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#e4e7ec',
                  marginBottom: 8,
                }}
              >
                Mô tả chi tiết <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                placeholder="Mô tả chi tiết về phương án thực hiện, kinh nghiệm liên quan, và lý do bạn phù hợp với dự án này..."
                className="input"
                rows={6}
                style={{
                  resize: 'vertical',
                  minHeight: 150,
                  borderColor: errors.proposal ? '#ef4444' : undefined,
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                {errors.proposal ? (
                  <p style={{ fontSize: 12, color: '#ef4444' }}>{errors.proposal}</p>
                ) : (
                  <span />
                )}
                <span
                  style={{
                    fontSize: 12,
                    color: proposal.length < MIN_PROPOSAL_LENGTH ? '#f59e0b' : '#71717a',
                  }}
                >
                  {proposal.length}/{MIN_PROPOSAL_LENGTH} ký tự tối thiểu
                </span>
              </div>
            </div>
          </div>

          {/* Attachments - Requirement 11.4 */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e4e7ec', marginBottom: 16 }}>
              Tệp đính kèm
              <span style={{ fontSize: 12, fontWeight: 400, color: '#71717a', marginLeft: 8 }}>
                (Tối đa {MAX_ATTACHMENTS} tệp)
              </span>
            </h3>

            {/* Upload Button */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed #3f3f46',
                  borderRadius: 8,
                  cursor: attachments.length >= MAX_ATTACHMENTS ? 'not-allowed' : 'pointer',
                  opacity: attachments.length >= MAX_ATTACHMENTS ? 0.5 : 1,
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={attachments.length >= MAX_ATTACHMENTS || uploadingFiles}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                {uploadingFiles ? (
                  <i className="ri-loader-4-line spinner" style={{ color: '#f5d393' }} />
                ) : (
                  <i className="ri-upload-2-line" style={{ color: '#a1a1aa' }} />
                )}
                <span style={{ color: '#a1a1aa', fontSize: 14 }}>
                  {uploadingFiles ? 'Đang tải lên...' : 'Chọn tệp'}
                </span>
              </label>
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 8,
                    }}
                  >
                    <i
                      className={
                        attachment.type.includes('pdf')
                          ? 'ri-file-pdf-line'
                          : attachment.type.includes('image')
                          ? 'ri-image-line'
                          : 'ri-file-line'
                      }
                      style={{ fontSize: 20, color: '#f5d393' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          color: '#e4e7ec',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {attachment.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#71717a' }}>
                        {formatFileSize(attachment.size)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                    >
                      <i className="ri-close-line" style={{ fontSize: 18 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Win Fee Preview - Requirement 11.5 */}
          {settings && typeof settings.winFeePercentage === 'number' && price && parseFloat(price) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{
                padding: 20,
                marginBottom: 24,
                background: 'rgba(245, 211, 147, 0.05)',
                border: '1px solid rgba(245, 211, 147, 0.2)',
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#f5d393',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="ri-information-line" />
                Phí dịch vụ khi thắng
              </h3>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 4 }}>
                    Phí thắng thầu ({settings.winFeePercentage}% giá đề xuất)
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a' }}>
                    Chỉ thanh toán khi bạn được chọn
                  </div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#f5d393' }}>
                  {formatCurrency(calculateWinFee())}
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: 150 }}
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line spinner" style={{ marginRight: 8 }} />
                  Đang gửi...
                </>
              ) : editBidId ? (
                'Cập nhật đề xuất'
              ) : (
                'Gửi đề xuất'
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </Layout>
  );
}
