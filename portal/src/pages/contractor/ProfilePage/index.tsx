/**
 * Contractor Profile Management Page
 *
 * Displays:
 * - Current profile display (Requirement 12.1)
 * - Edit form for description, experience, specialties (Requirement 12.2)
 * - Portfolio image upload (max 10) (Requirement 12.3)
 * - Certificate upload (max 5) (Requirement 12.4)
 * - Verification submission (Requirement 12.5)
 * - Activity history tab (Requirement 23.1)
 *
 * **Feature: bidding-phase6-portal, code-refactoring**
 * **Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 23.1, 4.3, 4.4**
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../auth/AuthContext';
import { Layout } from '../../../components/Layout';
import { useToast } from '../../../components/Toast';
import { ActivityHistory } from '../../../components/ActivityHistory';
import {
  contractorProfileApi,
  marketplaceApi,
  mediaApi,
  type ContractorProfile,
  type Certificate,
  type Region,
} from '../../../api';

// Sub-components
import { ProfileForm } from './ProfileForm';
import { ProfileDocuments } from './ProfileDocuments';
import { ProfilePreview, VerificationRequirements } from './ProfilePreview';
import { ProfileCertificates, MAX_CERTIFICATES } from './ProfileCertificates';
import { ProfilePortfolio, MAX_PORTFOLIO_IMAGES } from './ProfilePortfolio';

// Tab types
type ProfileTab = 'profile' | 'activity';

export function ProfilePage() {
  const { user, refreshToken } = useAuth();
  const { showToast } = useToast();

  // Tab state - Requirements: 23.1
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // State
  const [, setProfile] = useState<ContractorProfile | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [uploadingIdCard, setUploadingIdCard] = useState<'front' | 'back' | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState<string>('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [idCardFront, setIdCardFront] = useState<string>('');
  const [idCardBack, setIdCardBack] = useState<string>('');
  const [businessLicenseImage, setBusinessLicenseImage] = useState<string>('');

  // Verification status
  const verificationStatus = user?.verificationStatus;
  const isVerified = verificationStatus === 'VERIFIED';
  const isPending = verificationStatus === 'PENDING';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileData, regionsData] = await Promise.all([
        contractorProfileApi.getProfile().catch(() => null),
        marketplaceApi.getRegions(),
      ]);

      setRegions(regionsData);

      if (profileData) {
        setProfile(profileData);
        setDescription(profileData.description || '');
        setExperience(profileData.experience?.toString() || '');
        setSpecialties(profileData.specialties || []);
        setServiceAreas(profileData.serviceAreas || []);
        setPortfolioImages(profileData.portfolioImages || []);
        setCertificates(profileData.certificates || []);
        setIdCardFront(profileData.idCardFront || '');
        setIdCardBack(profileData.idCardBack || '');
        setBusinessLicenseImage(profileData.businessLicenseImage || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      showToast('Không thể tải thông tin hồ sơ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const data = {
        description: description.trim(),
        experience: experience ? parseInt(experience, 10) : undefined,
        specialties,
        serviceAreas,
        portfolioImages,
        certificates,
        idCardFront: idCardFront || undefined,
        idCardBack: idCardBack || undefined,
        businessLicenseImage: businessLicenseImage || undefined,
      };

      const updatedProfile = await contractorProfileApi.updateProfile(data);
      setProfile(updatedProfile);
      showToast('Đã lưu hồ sơ thành công', 'success');
    } catch (error) {
      console.error('Failed to save profile:', error);
      showToast('Không thể lưu hồ sơ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    // Validate required fields
    if (!idCardFront || !idCardBack) {
      showToast('Vui lòng tải lên CMND/CCCD mặt trước và mặt sau', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Vui lòng nhập mô tả về bản thân/công ty', 'error');
      return;
    }

    setIsSubmittingVerification(true);
    try {
      // Save profile first
      await handleSaveProfile();

      // Submit for verification
      await contractorProfileApi.submitVerification();
      showToast(
        'Đã gửi hồ sơ xác minh. Chúng tôi sẽ xem xét trong 1-2 ngày làm việc.',
        'success'
      );

      // Refresh token to get updated verification status
      if (refreshToken) {
        await refreshToken();
      }
    } catch (error) {
      console.error('Failed to submit verification:', error);
      showToast('Không thể gửi hồ sơ xác minh. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (portfolioImages.length + files.length > MAX_PORTFOLIO_IMAGES) {
      showToast(`Chỉ được tải lên tối đa ${MAX_PORTFOLIO_IMAGES} ảnh portfolio`, 'error');
      return;
    }

    setUploadingPortfolio(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await mediaApi.upload(file, 'portfolio');
        return result.url;
      });

      const newUrls = await Promise.all(uploadPromises);
      setPortfolioImages((prev) => [...prev, ...newUrls]);
      showToast('Đã tải lên ảnh portfolio', 'success');
    } catch (error) {
      console.error('Failed to upload portfolio:', error);
      showToast('Không thể tải lên ảnh. Vui lòng thử lại.', 'error');
    } finally {
      setUploadingPortfolio(false);
      e.target.value = '';
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    setPortfolioImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (certificates.length + files.length > MAX_CERTIFICATES) {
      showToast(`Chỉ được tải lên tối đa ${MAX_CERTIFICATES} chứng chỉ`, 'error');
      return;
    }

    setUploadingCertificate(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await mediaApi.upload(file, 'certificates');
        return {
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl: result.url,
          issuedDate: new Date().toISOString().split('T')[0],
        };
      });

      const newCerts = await Promise.all(uploadPromises);
      setCertificates((prev) => [...prev, ...newCerts]);
      showToast('Đã tải lên chứng chỉ', 'success');
    } catch (error) {
      console.error('Failed to upload certificate:', error);
      showToast('Không thể tải lên chứng chỉ. Vui lòng thử lại.', 'error');
    } finally {
      setUploadingCertificate(false);
      e.target.value = '';
    }
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIdCardUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdCard(side);
    try {
      const result = await mediaApi.upload(file, 'id-cards');
      if (side === 'front') {
        setIdCardFront(result.url);
      } else {
        setIdCardBack(result.url);
      }
      showToast(`Đã tải lên CMND/CCCD mặt ${side === 'front' ? 'trước' : 'sau'}`, 'success');
    } catch (error) {
      console.error('Failed to upload ID card:', error);
      showToast('Không thể tải lên ảnh. Vui lòng thử lại.', 'error');
    } finally {
      setUploadingIdCard(null);
      e.target.value = '';
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLicense(true);
    try {
      const result = await mediaApi.upload(file, 'licenses');
      setBusinessLicenseImage(result.url);
      showToast('Đã tải lên giấy phép kinh doanh', 'success');
    } catch (error) {
      console.error('Failed to upload license:', error);
      showToast('Không thể tải lên ảnh. Vui lòng thử lại.', 'error');
    } finally {
      setUploadingLicense(false);
      e.target.value = '';
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const toggleServiceArea = (regionId: string) => {
    setServiceAreas((prev) =>
      prev.includes(regionId) ? prev.filter((r) => r !== regionId) : [...prev, regionId]
    );
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

  return (
    <Layout>
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 24 }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e4e7ec', marginBottom: 4 }}>
            Hồ sơ năng lực
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>
            Quản lý thông tin và xác minh tài khoản
          </p>
        </motion.div>

        {/* Tab Navigation - Requirements: 23.1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 24,
            background: 'rgba(255, 255, 255, 0.02)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'profile' ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
              color: activeTab === 'profile' ? '#f5d393' : '#a1a1aa',
              fontWeight: activeTab === 'profile' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <i className="ri-user-line" />
            Hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'activity' ? 'rgba(245, 211, 147, 0.15)' : 'transparent',
              color: activeTab === 'activity' ? '#f5d393' : '#a1a1aa',
              fontWeight: activeTab === 'activity' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <i className="ri-history-line" />
            Hoạt động
          </button>
        </motion.div>

        {/* Activity Tab Content - Requirements: 23.1 */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 24 }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e4e7ec', marginBottom: 20 }}>
              Lịch sử hoạt động
            </h2>
            <ActivityHistory showFilters={true} />
          </motion.div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            {/* Verification Status Banner */}
            <ProfilePreview
              verificationStatus={verificationStatus}
            />

            {/* Basic Info, Specialties, Service Areas */}
            <ProfileForm
              description={description}
              setDescription={setDescription}
              experience={experience}
              setExperience={setExperience}
              specialties={specialties}
              toggleSpecialty={toggleSpecialty}
              serviceAreas={serviceAreas}
              toggleServiceArea={toggleServiceArea}
              regions={regions}
            />

            {/* Portfolio Images */}
            <ProfilePortfolio
              portfolioImages={portfolioImages}
              uploadingPortfolio={uploadingPortfolio}
              onPortfolioUpload={handlePortfolioUpload}
              onRemovePortfolioImage={handleRemovePortfolioImage}
            />

            {/* Certificates */}
            <ProfileCertificates
              certificates={certificates}
              setCertificates={setCertificates}
              uploadingCertificate={uploadingCertificate}
              onCertificateUpload={handleCertificateUpload}
              onRemoveCertificate={handleRemoveCertificate}
            />

            {/* ID Card and Business License */}
            <ProfileDocuments
              idCardFront={idCardFront}
              setIdCardFront={setIdCardFront}
              idCardBack={idCardBack}
              setIdCardBack={setIdCardBack}
              businessLicenseImage={businessLicenseImage}
              setBusinessLicenseImage={setBusinessLicenseImage}
              uploadingIdCard={uploadingIdCard}
              uploadingLicense={uploadingLicense}
              onIdCardUpload={handleIdCardUpload}
              onLicenseUpload={handleLicenseUpload}
            />

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                paddingTop: 16,
                borderTop: '1px solid #27272a',
              }}
            >
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="btn btn-secondary"
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: '1px solid #3f3f46',
                  background: 'transparent',
                  color: '#e4e7ec',
                  cursor: isSaving ? 'wait' : 'pointer',
                  opacity: isSaving ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {isSaving ? (
                  <i className="ri-loader-4-line spinner" />
                ) : (
                  <i className="ri-save-line" />
                )}
                {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>

              {!isVerified && !isPending && (
                <button
                  type="button"
                  onClick={handleSubmitVerification}
                  disabled={
                    isSubmittingVerification ||
                    !idCardFront ||
                    !idCardBack ||
                    !description.trim()
                  }
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#f5d393',
                    color: '#18181b',
                    fontWeight: 600,
                    cursor:
                      isSubmittingVerification ||
                      !idCardFront ||
                      !idCardBack ||
                      !description.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      isSubmittingVerification ||
                      !idCardFront ||
                      !idCardBack ||
                      !description.trim()
                        ? 0.5
                        : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isSubmittingVerification ? (
                    <i className="ri-loader-4-line spinner" />
                  ) : (
                    <i className="ri-shield-check-line" />
                  )}
                  {isSubmittingVerification ? 'Đang gửi...' : 'Gửi xác minh'}
                </button>
              )}
            </motion.div>

            {/* Verification Requirements Info */}
            {!isVerified && !isPending && (
              <VerificationRequirements
                description={description}
                idCardFront={idCardFront}
                idCardBack={idCardBack}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
