/**
 * Homeowner Project Creation Wizard
 *
 * Multi-step form wizard:
 * - Step 1: Basic info (title, description, category) (Requirement 7.1)
 * - Step 2: Location (region, address) (Requirement 7.2)
 * - Step 3: Details (area, budget, timeline) (Requirement 7.3)
 * - Step 4: Images (upload up to 10) (Requirement 7.4)
 * - Step 5: Review and submit (Requirement 7.5, 7.6)
 *
 * Auto-save functionality:
 * - Auto-saves draft every 30 seconds (Requirement 22.1)
 * - Restores draft on return (Requirement 22.3)
 * - Cleans up draft on successful submission (Requirement 22.5)
 *
 * **Feature: bidding-phase6-portal, code-refactoring**
 * **Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 22.1, 22.3, 22.5, 4.3, 4.4**
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { DraftRecoveryModal } from '../../../components/DraftRecoveryModal';
import { useDraft } from '../../../hooks/useDraft';
import { DRAFT_KEYS } from '../../../services/draftStorage';
import {
  projectsApi,
  marketplaceApi,
  mediaApi,
  type CreateProjectInput,
  type ServiceCategory,
  type Region,
} from '../../../api';

// Sub-components
import { ProjectBasicInfo } from './ProjectBasicInfo';
import { ProjectLocation, ProjectDetails } from './ProjectDetails';
import { ProjectImages, MAX_PROJECT_IMAGES } from './ProjectImages';
import { ProjectReview } from './ProjectReview';

interface FormData {
  // Step 1: Basic info
  title: string;
  description: string;
  categoryId: string;
  // Step 2: Location
  regionId: string;
  address: string;
  // Step 3: Details
  area: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
  requirements: string;
  // Step 4: Images
  images: string[];
}

const INITIAL_FORM_DATA: FormData = {
  title: '',
  description: '',
  categoryId: '',
  regionId: '',
  address: '',
  area: '',
  budgetMin: '',
  budgetMax: '',
  timeline: '',
  requirements: '',
  images: [],
};

const STEPS = [
  { id: 1, title: 'Thông tin cơ bản', icon: 'ri-file-text-line' },
  { id: 2, title: 'Vị trí', icon: 'ri-map-pin-line' },
  { id: 3, title: 'Chi tiết', icon: 'ri-list-settings-line' },
  { id: 4, title: 'Hình ảnh', icon: 'ri-image-line' },
  { id: 5, title: 'Xác nhận', icon: 'ri-check-double-line' },
];

export function CreateProjectPage() {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [createdProject, setCreatedProject] = useState<{ id: string; code: string } | null>(null);

  // Draft auto-save hook - Requirements 22.1, 22.3, 22.5
  const {
    isExpired,
    draftInfo,
    isAutoSaving,
    lastSavedText,
    save: saveDraft,
    clear: clearDraft,
    showRecoveryModal,
    handleContinueDraft,
    handleStartFresh,
  } = useDraft<FormData>({
    draftKey: DRAFT_KEYS.PROJECT,
    initialData: INITIAL_FORM_DATA,
    onRestore: (data) => {
      setFormData(data);
    },
  });

  // Auto-save form data when it changes
  useEffect(() => {
    if (formData !== INITIAL_FORM_DATA) {
      saveDraft(formData);
    }
  }, [formData, saveDraft]);

  // Load categories and regions
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, regionsData] = await Promise.all([
          marketplaceApi.getCategories(),
          marketplaceApi.getRegions(),
        ]);
        setCategories(categoriesData);
        setRegions(regionsData);
      } catch (error) {
        console.error('Failed to load form data:', error);
      }
    };
    loadData();
  }, []);

  const updateFormData = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
        else if (formData.title.length < 10) newErrors.title = 'Tiêu đề phải có ít nhất 10 ký tự';
        if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
        else if (formData.description.length < 50) newErrors.description = 'Mô tả phải có ít nhất 50 ký tự';
        if (!formData.categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục';
        break;
      case 2:
        if (!formData.regionId) newErrors.regionId = 'Vui lòng chọn khu vực';
        break;
      case 3:
        // Optional fields, no validation required
        if (formData.budgetMin && formData.budgetMax) {
          const min = parseFloat(formData.budgetMin);
          const max = parseFloat(formData.budgetMax);
          if (min > max) newErrors.budgetMax = 'Ngân sách tối đa phải lớn hơn tối thiểu';
        }
        break;
      case 4:
        // Images are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageUpload = async (files: FileList) => {
    if (formData.images.length + files.length > MAX_PROJECT_IMAGES) {
      setErrors(prev => ({ ...prev, images: `Tối đa ${MAX_PROJECT_IMAGES} hình ảnh` }));
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = Array.from(files).map(file => mediaApi.upload(file, 'projects'));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url);
      updateFormData('images', [...formData.images, ...newUrls]);
    } catch (error) {
      console.error('Failed to upload images:', error);
      setErrors(prev => ({ ...prev, images: 'Không thể tải lên hình ảnh' }));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);
  };

  const handleSubmit = async (asDraft = false) => {
    setIsSubmitting(true);
    try {
      const projectData: CreateProjectInput = {
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId,
        regionId: formData.regionId,
        address: formData.address || undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        timeline: formData.timeline || undefined,
        requirements: formData.requirements || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
      };

      const project = await projectsApi.createProject(projectData);
      
      if (!asDraft) {
        // Submit for approval
        await projectsApi.submitProject(project.id);
      }

      // Clear draft on successful submission - Requirement 22.5
      clearDraft();

      setCreatedProject({ id: project.id, code: project.code });
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors(prev => ({ ...prev, title: 'Không thể tạo dự án. Vui lòng thử lại.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (createdProject) {
    return (
      <Layout>
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <i className="ri-check-line" style={{ fontSize: 40, color: '#22c55e' }} />
            </div>
            
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 12 }}>
              Tạo dự án thành công!
            </h1>
            
            <p style={{ color: '#a1a1aa', marginBottom: 8 }}>
              Mã dự án của bạn là:
            </p>
            
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f5d393',
                padding: '12px 24px',
                background: 'rgba(245, 211, 147, 0.1)',
                borderRadius: 8,
                display: 'inline-block',
                marginBottom: 24,
              }}
            >
              {createdProject.code}
            </div>
            
            <p style={{ color: '#a1a1aa', marginBottom: 32 }}>
              Dự án của bạn đang chờ được duyệt. Chúng tôi sẽ thông báo khi có kết quả.
            </p>
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/homeowner/projects')}
              >
                Xem danh sách dự án
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/homeowner/projects/${createdProject.id}`)}
              >
                Xem chi tiết dự án
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Draft Recovery Modal - Requirements 22.3, 22.4 */}
      <DraftRecoveryModal
        isOpen={showRecoveryModal}
        savedAt={draftInfo?.savedAt || null}
        isExpired={isExpired}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />

      <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 8 }}>
                Tạo dự án mới
              </h1>
              <p style={{ color: '#a1a1aa' }}>
                Điền thông tin để đăng dự án và nhận đề xuất từ nhà thầu
              </p>
            </div>
            {/* Auto-save indicator */}
            {(isAutoSaving || lastSavedText) && (
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

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 32,
            position: 'relative',
          }}
        >
          {/* Progress Line */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 40,
              right: 40,
              height: 2,
              background: '#27272a',
            }}
          >
            <div
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                height: '100%',
                background: '#f5d393',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {STEPS.map((step) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: currentStep >= step.id ? '#f5d393' : '#27272a',
                  color: currentStep >= step.id ? '#0b0c0f' : '#71717a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                  transition: 'all 0.3s ease',
                }}
              >
                {currentStep > step.id ? (
                  <i className="ri-check-line" style={{ fontSize: 18 }} />
                ) : (
                  <i className={step.icon} style={{ fontSize: 18 }} />
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: currentStep >= step.id ? '#e4e7ec' : '#71717a',
                  textAlign: 'center',
                  maxWidth: 80,
                }}
              >
                {step.title}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Form Content */}
        <div className="card" style={{ padding: 24 }}>
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info - Requirement 7.1 */}
            {currentStep === 1 && (
              <ProjectBasicInfo
                title={formData.title}
                description={formData.description}
                categoryId={formData.categoryId}
                categories={categories}
                errors={errors}
                onUpdate={(field, value) => updateFormData(field, value)}
              />
            )}

            {/* Step 2: Location - Requirement 7.2 */}
            {currentStep === 2 && (
              <ProjectLocation
                regionId={formData.regionId}
                address={formData.address}
                regions={regions}
                errors={errors}
                onUpdate={(field, value) => updateFormData(field, value)}
              />
            )}

            {/* Step 3: Details - Requirement 7.3 */}
            {currentStep === 3 && (
              <ProjectDetails
                area={formData.area}
                budgetMin={formData.budgetMin}
                budgetMax={formData.budgetMax}
                timeline={formData.timeline}
                requirements={formData.requirements}
                errors={errors}
                onUpdate={(field, value) => updateFormData(field, value)}
              />
            )}

            {/* Step 4: Images - Requirement 7.4 */}
            {currentStep === 4 && (
              <ProjectImages
                images={formData.images}
                uploadingImages={uploadingImages}
                errors={errors}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
              />
            )}

            {/* Step 5: Review - Requirement 7.5 */}
            {currentStep === 5 && (
              <ProjectReview
                title={formData.title}
                description={formData.description}
                categoryId={formData.categoryId}
                regionId={formData.regionId}
                address={formData.address}
                area={formData.area}
                budgetMin={formData.budgetMin}
                budgetMax={formData.budgetMax}
                timeline={formData.timeline}
                requirements={formData.requirements}
                images={formData.images}
                categories={categories}
                regions={regions}
              />
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid #27272a',
            }}
          >
            <button
              className="btn btn-secondary"
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{ opacity: currentStep === 1 ? 0.5 : 1 }}
            >
              <i className="ri-arrow-left-line" style={{ marginRight: 8 }} />
              Quay lại
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              {currentStep === 5 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  Lưu nháp
                </button>
              )}
              
              {currentStep < 5 ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Tiếp tục
                  <i className="ri-arrow-right-line" style={{ marginLeft: 8 }} />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line spinner" style={{ marginRight: 8 }} />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line" style={{ marginRight: 8 }} />
                      Gửi duyệt
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
