/**
 * LegalContentPreview Component
 * Preview for LEGAL_CONTENT section type (Privacy Policy & Terms of Use)
 */

import { useState } from 'react';
import { tokens } from '../../../../theme';
import type { PreviewProps } from './types';

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

export function LegalContentPreview({ data }: PreviewProps) {
  const documentType = (data.documentType as string) || 'privacy_policy';
  const companyName = (data.companyName as string) || 'Công ty';
  const companyEmail = (data.companyEmail as string) || 'contact@company.vn';
  const companyPhone = (data.companyPhone as string) || '';
  const companyAddress = (data.companyAddress as string) || '';
  const effectiveDate = (data.effectiveDate as string) || '';
  const privacyPolicy = (data.privacyPolicy as PrivacyPolicyData) || {};
  const termsOfUse = (data.termsOfUse as TermsOfUseData) || {};
  const showTableOfContents = data.showTableOfContents !== false;
  const layout = (data.layout as string) || 'tabs';

  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderSection = (title: string, content: string | undefined, icon: string) => {
    if (!content) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ 
          fontSize: 15, 
          fontWeight: 600, 
          color: tokens.color.text, 
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <i className={icon} style={{ color: tokens.color.primary, fontSize: 16 }} />
          {title}
        </h3>
        <p style={{ fontSize: 13, color: tokens.color.textMuted, lineHeight: 1.6, margin: 0 }}>
          {content}
        </p>
      </div>
    );
  };

  const renderListSection = (title: string, items: LegalItem[] | undefined, icon: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ 
          fontSize: 15, 
          fontWeight: 600, 
          color: tokens.color.text, 
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <i className={icon} style={{ color: tokens.color.primary, fontSize: 16 }} />
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, index) => (
            <div 
              key={item._id || index} 
              style={{ 
                padding: 12, 
                background: tokens.color.surfaceAlt, 
                borderRadius: tokens.radius.md,
                borderLeft: `3px solid ${tokens.color.primary}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.color.text, marginBottom: 4 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: tokens.color.textMuted, lineHeight: 1.5 }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPrivacyPolicy = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${tokens.color.border}`,
      }}>
        <i className="ri-shield-check-line" style={{ fontSize: 24, color: tokens.color.success }} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
            Chính Sách Bảo Mật
          </h2>
          <p style={{ fontSize: 11, color: tokens.color.muted, margin: 0 }}>
            Cập nhật: {formatDate(effectiveDate) || 'Chưa xác định'}
          </p>
        </div>
      </div>

      {showTableOfContents && (
        <div style={{ 
          padding: 12, 
          background: tokens.color.surfaceAlt, 
          borderRadius: tokens.radius.md, 
          marginBottom: 20,
          fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: 8 }}>Mục lục</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: tokens.color.primary }}>
            <span>1. Giới thiệu</span>
            <span>2. Dữ liệu thu thập</span>
            <span>3. Mục đích sử dụng</span>
            <span>4. Bảo vệ dữ liệu</span>
            <span>5. Chia sẻ dữ liệu</span>
            <span>6. Quyền của bạn</span>
            <span>7. Cookies</span>
          </div>
        </div>
      )}

      {renderSection('1. Giới thiệu', privacyPolicy.introduction, 'ri-information-line')}
      {renderListSection('2. Dữ liệu thu thập', privacyPolicy.dataCollection, 'ri-database-2-line')}
      {renderListSection('3. Mục đích sử dụng', privacyPolicy.dataUsage, 'ri-focus-3-line')}
      {renderSection('4. Bảo vệ dữ liệu', privacyPolicy.dataProtection, 'ri-lock-line')}
      {renderSection('5. Chia sẻ dữ liệu', privacyPolicy.dataSharing, 'ri-share-line')}
      {renderListSection('6. Quyền của bạn', privacyPolicy.userRights, 'ri-user-settings-line')}
      {renderSection('7. Cookies', privacyPolicy.cookies, 'ri-cookie-line')}
    </div>
  );

  const renderTermsOfUse = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${tokens.color.border}`,
      }}>
        <i className="ri-file-list-2-line" style={{ fontSize: 24, color: tokens.color.warning }} />
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: tokens.color.text, margin: 0 }}>
            Điều Khoản Sử Dụng
          </h2>
          <p style={{ fontSize: 11, color: tokens.color.muted, margin: 0 }}>
            Cập nhật: {formatDate(effectiveDate) || 'Chưa xác định'}
          </p>
        </div>
      </div>

      {showTableOfContents && (
        <div style={{ 
          padding: 12, 
          background: tokens.color.surfaceAlt, 
          borderRadius: tokens.radius.md, 
          marginBottom: 20,
          fontSize: 12,
        }}>
          <div style={{ fontWeight: 600, color: tokens.color.text, marginBottom: 8 }}>Mục lục</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, color: tokens.color.primary }}>
            <span>1. Giới thiệu</span>
            <span>2. Mô tả dịch vụ</span>
            <span>3. Nghĩa vụ người dùng</span>
            <span>4. Sở hữu trí tuệ</span>
            <span>5. Giới hạn trách nhiệm</span>
            <span>6. Thanh toán</span>
            <span>7. Chấm dứt</span>
            <span>8. Giải quyết tranh chấp</span>
          </div>
        </div>
      )}

      {renderSection('1. Giới thiệu', termsOfUse.introduction, 'ri-information-line')}
      {renderSection('2. Mô tả dịch vụ', termsOfUse.serviceDescription, 'ri-service-line')}
      {renderListSection('3. Nghĩa vụ người dùng', termsOfUse.userObligations, 'ri-user-follow-line')}
      {renderSection('4. Sở hữu trí tuệ', termsOfUse.intellectualProperty, 'ri-copyright-line')}
      {renderListSection('5. Giới hạn trách nhiệm', termsOfUse.liability, 'ri-error-warning-line')}
      {renderSection('6. Thanh toán', termsOfUse.paymentTerms, 'ri-money-dollar-circle-line')}
      {renderSection('7. Chấm dứt', termsOfUse.termination, 'ri-close-circle-line')}
      {renderSection('8. Giải quyết tranh chấp', termsOfUse.disputeResolution, 'ri-scales-3-line')}
      {renderSection('9. Thay đổi điều khoản', termsOfUse.changes, 'ri-refresh-line')}
    </div>
  );

  const renderContactInfo = () => (
    <div style={{ 
      marginTop: 20, 
      padding: 16, 
      background: tokens.color.surfaceAlt, 
      borderRadius: tokens.radius.md,
      borderTop: `3px solid ${tokens.color.primary}`,
    }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: tokens.color.text, marginBottom: 12 }}>
        Liên hệ
      </h4>
      <div style={{ fontSize: 12, color: tokens.color.textMuted, lineHeight: 1.8 }}>
        <div><strong>{companyName}</strong></div>
        {companyAddress && <div><i className="ri-map-pin-line" style={{ marginRight: 6 }} />{companyAddress}</div>}
        {companyEmail && <div><i className="ri-mail-line" style={{ marginRight: 6 }} />{companyEmail}</div>}
        {companyPhone && <div><i className="ri-phone-line" style={{ marginRight: 6 }} />{companyPhone}</div>}
      </div>
    </div>
  );

  // Single document type
  if (documentType === 'privacy_policy') {
    return (
      <div style={{ fontSize: 13 }}>
        {renderPrivacyPolicy()}
        {renderContactInfo()}
      </div>
    );
  }

  if (documentType === 'terms_of_use') {
    return (
      <div style={{ fontSize: 13 }}>
        {renderTermsOfUse()}
        {renderContactInfo()}
      </div>
    );
  }

  // Both documents - tabs layout
  if (layout === 'tabs') {
    return (
      <div style={{ fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('privacy')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === 'privacy' ? tokens.color.primary : tokens.color.surfaceAlt,
              color: activeTab === 'privacy' ? '#111' : tokens.color.text,
              border: 'none',
              borderRadius: `${tokens.radius.md} 0 0 ${tokens.radius.md}`,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i className="ri-shield-check-line" />
            Chính sách bảo mật
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: activeTab === 'terms' ? tokens.color.primary : tokens.color.surfaceAlt,
              color: activeTab === 'terms' ? '#111' : tokens.color.text,
              border: 'none',
              borderRadius: `0 ${tokens.radius.md} ${tokens.radius.md} 0`,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <i className="ri-file-list-2-line" />
            Điều khoản sử dụng
          </button>
        </div>
        {activeTab === 'privacy' ? renderPrivacyPolicy() : renderTermsOfUse()}
        {renderContactInfo()}
      </div>
    );
  }

  // Stacked layout
  return (
    <div style={{ fontSize: 13 }}>
      {renderPrivacyPolicy()}
      <div style={{ height: 32, borderBottom: `1px dashed ${tokens.color.border}`, marginBottom: 24 }} />
      {renderTermsOfUse()}
      {renderContactInfo()}
    </div>
  );
}
