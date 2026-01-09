/**
 * LegalContent Section Component
 * Renders Privacy Policy & Terms of Use for landing page
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '@app/shared';

interface LegalItem {
  _id: string;
  title: string;
  description: string;
}

interface PrivacyPolicyData {
  introduction?: string;
  dataCollection?: LegalItem[];
  dataUsage?: LegalItem[];
  dataProtection?: string;
  dataSharing?: string;
  userRights?: LegalItem[];
  cookies?: string;
}

interface TermsOfUseData {
  introduction?: string;
  serviceDescription?: string;
  userObligations?: LegalItem[];
  intellectualProperty?: string;
  liability?: LegalItem[];
  paymentTerms?: string;
  termination?: string;
  disputeResolution?: string;
  changes?: string;
}

interface LegalContentData {
  documentType?: 'privacy_policy' | 'terms_of_use' | 'both';
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  privacyPolicy?: PrivacyPolicyData;
  termsOfUse?: TermsOfUseData;
  showTableOfContents?: boolean;
  layout?: 'tabs' | 'accordion' | 'stacked';
}

interface LegalContentProps {
  data: LegalContentData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Wrapper component with Blog-style dark box
function LegalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '60px auto 80px',
        padding: '0 12px',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: 'rgba(12,12,16,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          padding: 'clamp(32px, 6vw, 64px) clamp(20px, 4vw, 48px)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalContent({ data }: LegalContentProps) {
  const {
    documentType = 'both',
    companyName = 'Công ty',
    companyAddress = '',
    companyEmail = '',
    companyPhone = '',
    effectiveDate = '',
    privacyPolicy = {},
    termsOfUse = {},
    showTableOfContents = true,
    layout = 'tabs',
  } = data;

  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');
  const [expandedSections, setExpandedSections] = useState<string[]>(['privacy']);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Chưa xác định';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const toggleAccordion = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Table of Contents for Privacy Policy
  const privacyTOC = [
    { id: 'pp-intro', label: '1. Giới thiệu' },
    { id: 'pp-collection', label: '2. Dữ liệu thu thập' },
    { id: 'pp-usage', label: '3. Mục đích sử dụng' },
    { id: 'pp-protection', label: '4. Bảo vệ dữ liệu' },
    { id: 'pp-sharing', label: '5. Chia sẻ dữ liệu' },
    { id: 'pp-rights', label: '6. Quyền của bạn' },
    { id: 'pp-cookies', label: '7. Cookies' },
  ];

  // Table of Contents for Terms of Use
  const termsTOC = [
    { id: 'tou-intro', label: '1. Giới thiệu' },
    { id: 'tou-service', label: '2. Mô tả dịch vụ' },
    { id: 'tou-obligations', label: '3. Nghĩa vụ người dùng' },
    { id: 'tou-ip', label: '4. Sở hữu trí tuệ' },
    { id: 'tou-liability', label: '5. Giới hạn trách nhiệm' },
    { id: 'tou-payment', label: '6. Thanh toán' },
    { id: 'tou-termination', label: '7. Chấm dứt' },
    { id: 'tou-dispute', label: '8. Giải quyết tranh chấp' },
    { id: 'tou-changes', label: '9. Thay đổi điều khoản' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderSection = (id: string, title: string, content: string | undefined, icon: string) => {
    if (!content) return null;
    return (
      <motion.div id={id} variants={itemVariants} style={{ marginBottom: 32 }}>
        <h3 style={{
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 600,
          color: tokens.color.text,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className={icon} style={{ color: tokens.color.primary, fontSize: 20 }} />
          {title}
        </h3>
        <p style={{
          fontSize: 'clamp(14px, 2vw, 16px)',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.8,
          margin: 0,
        }}>
          {content}
        </p>
      </motion.div>
    );
  };

  const renderListSection = (id: string, title: string, items: LegalItem[] | undefined, icon: string) => {
    if (!items || items.length === 0) return null;
    return (
      <motion.div id={id} variants={itemVariants} style={{ marginBottom: 32 }}>
        <h3 style={{
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 600,
          color: tokens.color.text,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <i className={icon} style={{ color: tokens.color.primary, fontSize: 20 }} />
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item, index) => (
            <motion.div
              key={item._id || index}
              whileHover={{ x: 4 }}
              style={{
                padding: 'clamp(16px, 3vw, 20px)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: tokens.radius.md,
                borderLeft: `4px solid ${tokens.color.primary}`,
              }}
            >
              <div style={{
                fontSize: 'clamp(15px, 2vw, 17px)',
                fontWeight: 600,
                color: tokens.color.text,
                marginBottom: 8,
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: 'clamp(13px, 2vw, 15px)',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.7,
              }}>
                {item.description}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderTableOfContents = (items: { id: string; label: string }[]) => {
    if (!showTableOfContents) return null;
    return (
      <motion.div
        variants={itemVariants}
        style={{
          padding: 'clamp(16px, 3vw, 24px)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: tokens.radius.lg,
          marginBottom: 32,
        }}
      >
        <div style={{
          fontWeight: 600,
          color: tokens.color.text,
          marginBottom: 16,
          fontSize: 'clamp(14px, 2vw, 16px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <i className="ri-list-check" style={{ color: tokens.color.primary }} />
          Mục lục
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4, color: tokens.color.primary }}
              onClick={() => scrollToSection(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 'clamp(13px, 2vw, 15px)',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'color 0.2s',
              }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderPrivacyPolicy = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: tokens.radius.lg,
          background: `${tokens.color.success}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <i className="ri-shield-check-line" style={{ fontSize: 28, color: tokens.color.success }} />
        </div>
        <div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: 700,
            fontFamily: 'Playfair Display, serif',
            color: tokens.color.primary,
            margin: 0,
          }}>
            Chính Sách Bảo Mật
          </h2>
          <p style={{
            fontSize: 'clamp(12px, 2vw, 14px)',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}>
            Cập nhật: {formatDate(effectiveDate)}
          </p>
        </div>
      </motion.div>

      {renderTableOfContents(privacyTOC)}

      {renderSection('pp-intro', '1. Giới thiệu', privacyPolicy.introduction, 'ri-information-line')}
      {renderListSection('pp-collection', '2. Dữ liệu thu thập', privacyPolicy.dataCollection, 'ri-database-2-line')}
      {renderListSection('pp-usage', '3. Mục đích sử dụng', privacyPolicy.dataUsage, 'ri-focus-3-line')}
      {renderSection('pp-protection', '4. Bảo vệ dữ liệu', privacyPolicy.dataProtection, 'ri-lock-line')}
      {renderSection('pp-sharing', '5. Chia sẻ dữ liệu', privacyPolicy.dataSharing, 'ri-share-line')}
      {renderListSection('pp-rights', '6. Quyền của bạn', privacyPolicy.userRights, 'ri-user-settings-line')}
      {renderSection('pp-cookies', '7. Cookies', privacyPolicy.cookies, 'ri-cookie-line')}
    </motion.div>
  );

  const renderTermsOfUse = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: tokens.radius.lg,
          background: `${tokens.color.warning}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <i className="ri-file-list-2-line" style={{ fontSize: 28, color: tokens.color.warning }} />
        </div>
        <div>
          <h2 style={{
            fontSize: 'clamp(22px, 4vw, 28px)',
            fontWeight: 700,
            fontFamily: 'Playfair Display, serif',
            color: tokens.color.primary,
            margin: 0,
          }}>
            Điều Khoản Sử Dụng
          </h2>
          <p style={{
            fontSize: 'clamp(12px, 2vw, 14px)',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}>
            Cập nhật: {formatDate(effectiveDate)}
          </p>
        </div>
      </motion.div>

      {renderTableOfContents(termsTOC)}

      {renderSection('tou-intro', '1. Giới thiệu', termsOfUse.introduction, 'ri-information-line')}
      {renderSection('tou-service', '2. Mô tả dịch vụ', termsOfUse.serviceDescription, 'ri-service-line')}
      {renderListSection('tou-obligations', '3. Nghĩa vụ người dùng', termsOfUse.userObligations, 'ri-user-follow-line')}
      {renderSection('tou-ip', '4. Sở hữu trí tuệ', termsOfUse.intellectualProperty, 'ri-copyright-line')}
      {renderListSection('tou-liability', '5. Giới hạn trách nhiệm', termsOfUse.liability, 'ri-error-warning-line')}
      {renderSection('tou-payment', '6. Thanh toán', termsOfUse.paymentTerms, 'ri-money-dollar-circle-line')}
      {renderSection('tou-termination', '7. Chấm dứt', termsOfUse.termination, 'ri-close-circle-line')}
      {renderSection('tou-dispute', '8. Giải quyết tranh chấp', termsOfUse.disputeResolution, 'ri-scales-3-line')}
      {renderSection('tou-changes', '9. Thay đổi điều khoản', termsOfUse.changes, 'ri-refresh-line')}
    </motion.div>
  );

  const renderContactInfo = () => (
    <motion.div
      variants={itemVariants}
      style={{
        marginTop: 40,
        padding: 'clamp(20px, 4vw, 32px)',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: tokens.radius.lg,
        borderTop: `4px solid ${tokens.color.primary}`,
      }}
    >
      <h4 style={{
        fontSize: 'clamp(16px, 2.5vw, 18px)',
        fontWeight: 600,
        color: tokens.color.text,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <i className="ri-contacts-line" style={{ color: tokens.color.primary }} />
        Liên hệ
      </h4>
      <div style={{
        fontSize: 'clamp(13px, 2vw, 15px)',
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 2,
      }}>
        <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: 8 }}>{companyName}</div>
        {companyAddress && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="ri-map-pin-line" style={{ marginTop: 4, flexShrink: 0 }} />
            <span>{companyAddress}</span>
          </div>
        )}
        {companyEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-mail-line" />
            <a href={`mailto:${companyEmail}`} style={{ color: tokens.color.primary, textDecoration: 'none' }}>
              {companyEmail}
            </a>
          </div>
        )}
        {companyPhone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-phone-line" />
            <a href={`tel:${companyPhone}`} style={{ color: tokens.color.primary, textDecoration: 'none' }}>
              {companyPhone}
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Single document type
  if (documentType === 'privacy_policy') {
    return (
      <LegalWrapper>
        {renderPrivacyPolicy()}
        {renderContactInfo()}
      </LegalWrapper>
    );
  }

  if (documentType === 'terms_of_use') {
    return (
      <LegalWrapper>
        {renderTermsOfUse()}
        {renderContactInfo()}
      </LegalWrapper>
    );
  }

  // Both documents - tabs layout
  if (layout === 'tabs') {
    return (
      <LegalWrapper>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginBottom: 32,
          borderRadius: tokens.radius.lg,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
              background: activeTab === 'privacy' ? tokens.color.primary : 'rgba(255,255,255,0.03)',
              color: activeTab === 'privacy' ? '#111' : tokens.color.text,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 'clamp(13px, 2vw, 15px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className="ri-shield-check-line" />
            <span className="desktop-only">Chính sách bảo mật</span>
            <span className="mobile-only">Bảo mật</span>
          </motion.button>
          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: 'clamp(12px, 2vw, 16px) clamp(16px, 3vw, 24px)',
              background: activeTab === 'terms' ? tokens.color.primary : 'rgba(255,255,255,0.03)',
              color: activeTab === 'terms' ? '#111' : tokens.color.text,
              border: 'none',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 'clamp(13px, 2vw, 15px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <i className="ri-file-list-2-line" />
            <span className="desktop-only">Điều khoản sử dụng</span>
            <span className="mobile-only">Điều khoản</span>
          </motion.button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'privacy' ? renderPrivacyPolicy() : renderTermsOfUse()}
          </motion.div>
        </AnimatePresence>

        {renderContactInfo()}
      </LegalWrapper>
    );
  }

  // Accordion layout
  if (layout === 'accordion') {
    return (
      <LegalWrapper>
        {/* Privacy Policy Accordion */}
        <motion.div
          style={{
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
          }}
        >
          <motion.button
            whileHover={{ background: 'rgba(255,255,255,0.05)' }}
            onClick={() => toggleAccordion('privacy')}
            style={{
              width: '100%',
              padding: 'clamp(16px, 3vw, 20px)',
              background: 'rgba(255,255,255,0.03)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="ri-shield-check-line" style={{ fontSize: 24, color: tokens.color.success }} />
              <span style={{ fontWeight: 600, color: tokens.color.text, fontSize: 'clamp(15px, 2vw, 18px)' }}>
                Chính Sách Bảo Mật
              </span>
            </div>
            <motion.i
              className="ri-arrow-down-s-line"
              animate={{ rotate: expandedSections.includes('privacy') ? 180 : 0 }}
              style={{ fontSize: 24, color: tokens.color.muted }}
            />
          </motion.button>
          <AnimatePresence>
            {expandedSections.includes('privacy') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                  {renderPrivacyPolicy()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Terms of Use Accordion */}
        <motion.div
          style={{
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: tokens.radius.lg,
            overflow: 'hidden',
          }}
        >
          <motion.button
            whileHover={{ background: 'rgba(255,255,255,0.05)' }}
            onClick={() => toggleAccordion('terms')}
            style={{
              width: '100%',
              padding: 'clamp(16px, 3vw, 20px)',
              background: 'rgba(255,255,255,0.03)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="ri-file-list-2-line" style={{ fontSize: 24, color: tokens.color.warning }} />
              <span style={{ fontWeight: 600, color: tokens.color.text, fontSize: 'clamp(15px, 2vw, 18px)' }}>
                Điều Khoản Sử Dụng
              </span>
            </div>
            <motion.i
              className="ri-arrow-down-s-line"
              animate={{ rotate: expandedSections.includes('terms') ? 180 : 0 }}
              style={{ fontSize: 24, color: tokens.color.muted }}
            />
          </motion.button>
          <AnimatePresence>
            {expandedSections.includes('terms') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
                  {renderTermsOfUse()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {renderContactInfo()}
      </LegalWrapper>
    );
  }

  // Stacked layout (default)
  return (
    <LegalWrapper>
      {renderPrivacyPolicy()}
      
      <div style={{
        height: 1,
        background: 'rgba(255,255,255,0.1)',
        margin: '48px 0',
      }} />
      
      {renderTermsOfUse()}
      {renderContactInfo()}
    </LegalWrapper>
  );
}
