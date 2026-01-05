/**
 * LeadInfoStep - Step 6: Lead Form
 * 
 * **Feature: codebase-refactor-large-files**
 * **Requirements: 3.4, 5.4, 5.5, 6.11**
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';
import { LeadForm, LeadData } from '../LeadForm';

interface LeadInfoStepProps {
  initialData: LeadData;
  onSubmit: (data: LeadData) => void;
  onBack: () => void;
}

export const LeadInfoStep = memo(function LeadInfoStep({
  initialData,
  onSubmit,
  onBack,
}: LeadInfoStepProps) {
  return (
    <motion.div
      key="step6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <LeadForm
        onSubmit={onSubmit}
        initialData={initialData}
        formConfig={{
          title: 'Thông tin liên hệ',
          subtitle: 'Vui lòng nhập thông tin để nhận báo giá',
          buttonText: 'Tiếp tục chọn nội thất',
        }}
      />
      
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          width: '100%',
          marginTop: '0.75rem',
          padding: '0.875rem',
          borderRadius: tokens.radius.md,
          border: `1px solid ${tokens.color.border}`,
          background: 'transparent',
          color: tokens.color.text,
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <i className="ri-arrow-left-line" /> Quay lại
      </button>
    </motion.div>
  );
});
