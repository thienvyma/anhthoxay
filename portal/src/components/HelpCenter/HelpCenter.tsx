/**
 * HelpCenter Component
 *
 * Slide-out panel from right with FAQ search and contact support form.
 *
 * **Feature: bidding-phase6-portal**
 * **Requirements: 24.1, 24.2, 24.3, 24.4**
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FAQ_CATEGORIES,
  searchFAQs,
  getFAQsByCategory,
  type FAQCategory,
  type FAQItem,
  type FAQCategoryInfo,
} from '../../data/faqData';
import { ContactSupportForm } from './ContactSupportForm';

export interface HelpCenterProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel should close */
  onClose: () => void;
  /** Initial category to show */
  initialCategory?: FAQCategory;
  /** Custom class name */
  className?: string;
}

type ViewMode = 'categories' | 'category-detail' | 'search-results' | 'contact';

export function HelpCenter({
  isOpen,
  onClose,
  initialCategory,
  className,
}: HelpCenterProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(
    initialCategory || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FAQItem[]>([]);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setViewMode(initialCategory ? 'category-detail' : 'categories');
      setSelectedCategory(initialCategory || null);
      setSearchQuery('');
      setSearchResults([]);
      setExpandedFAQs(new Set());
    }
  }, [isOpen, initialCategory]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchFAQs(query);
      setSearchResults(results);
      setViewMode('search-results');
    } else {
      setSearchResults([]);
      setViewMode(selectedCategory ? 'category-detail' : 'categories');
    }
  }, [selectedCategory]);

  // Handle category selection
  const handleCategorySelect = (category: FAQCategory) => {
    setSelectedCategory(category);
    setViewMode('category-detail');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle back navigation
  const handleBack = () => {
    if (viewMode === 'contact') {
      setViewMode(searchResults.length > 0 ? 'search-results' : 'categories');
    } else if (viewMode === 'search-results') {
      setSearchQuery('');
      setSearchResults([]);
      setViewMode(selectedCategory ? 'category-detail' : 'categories');
    } else if (viewMode === 'category-detail') {
      setSelectedCategory(null);
      setViewMode('categories');
    }
  };

  // Toggle FAQ expansion
  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs((prev) => {
      const next = new Set(prev);
      if (next.has(faqId)) {
        next.delete(faqId);
      } else {
        next.add(faqId);
      }
      return next;
    });
  };

  // Show contact form
  const handleShowContactForm = () => {
    setViewMode('contact');
  };

  // Handle contact form success
  const handleContactSuccess = () => {
    setViewMode('categories');
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Get current FAQs to display
  const currentFAQs =
    viewMode === 'search-results'
      ? searchResults
      : selectedCategory
      ? getFAQsByCategory(selectedCategory)
      : [];

  // Get title based on view mode
  const getTitle = () => {
    if (viewMode === 'contact') return 'Liên hệ hỗ trợ';
    if (viewMode === 'search-results') return `Kết quả tìm kiếm (${searchResults.length})`;
    if (viewMode === 'category-detail' && selectedCategory) {
      const category = FAQ_CATEGORIES.find((c) => c.id === selectedCategory);
      return category?.name || 'FAQ';
    }
    return 'Trợ giúp';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="help-center-overlay"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`help-center-panel ${className || ''}`}
            role="dialog"
            aria-label="Trung tâm trợ giúp"
            aria-modal="true"
          >
            {/* Header */}
            <div className="help-center-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {viewMode !== 'categories' && (
                  <button
                    onClick={handleBack}
                    className="help-center-back-btn"
                    aria-label="Quay lại"
                  >
                    <i className="ri-arrow-left-line" />
                  </button>
                )}
                <h2 className="help-center-title">{getTitle()}</h2>
              </div>
              <button
                onClick={onClose}
                className="help-center-close-btn"
                aria-label="Đóng"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Search Bar */}
            {viewMode !== 'contact' && (
              <div className="help-center-search">
                <i className="ri-search-line help-center-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Tìm kiếm câu hỏi..."
                  className="help-center-search-input"
                  aria-label="Tìm kiếm FAQ"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="help-center-search-clear"
                    aria-label="Xóa tìm kiếm"
                  >
                    <i className="ri-close-circle-fill" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="help-center-content">
              {viewMode === 'categories' && (
                <CategoryList
                  categories={FAQ_CATEGORIES}
                  onSelect={handleCategorySelect}
                />
              )}

              {(viewMode === 'category-detail' || viewMode === 'search-results') && (
                <FAQList
                  faqs={currentFAQs}
                  expandedFAQs={expandedFAQs}
                  onToggle={toggleFAQ}
                  searchQuery={searchQuery}
                  showNoResults={viewMode === 'search-results' && searchResults.length === 0}
                  onContactSupport={handleShowContactForm}
                />
              )}

              {viewMode === 'contact' && (
                <ContactSupportForm
                  onSuccess={handleContactSuccess}
                  onCancel={handleBack}
                />
              )}
            </div>

            {/* Footer */}
            {viewMode !== 'contact' && (
              <div className="help-center-footer">
                <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12 }}>
                  Không tìm thấy câu trả lời?
                </p>
                <button
                  onClick={handleShowContactForm}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <i className="ri-customer-service-2-line" style={{ marginRight: 8 }} />
                  Liên hệ hỗ trợ
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Category List Component
 */
function CategoryList({
  categories,
  onSelect,
}: {
  categories: FAQCategoryInfo[];
  onSelect: (category: FAQCategory) => void;
}) {
  return (
    <div className="help-center-categories">
      <p style={{ fontSize: 14, color: '#a1a1aa', marginBottom: 16 }}>
        Chọn danh mục để xem các câu hỏi thường gặp
      </p>
      <div className="help-center-category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className="help-center-category-card"
          >
            <div className="help-center-category-icon">
              <i className={category.icon} />
            </div>
            <div className="help-center-category-info">
              <span className="help-center-category-name">{category.name}</span>
              <span className="help-center-category-desc">{category.description}</span>
            </div>
            <i className="ri-arrow-right-s-line help-center-category-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * FAQ List Component
 */
function FAQList({
  faqs,
  expandedFAQs,
  onToggle,
  searchQuery,
  showNoResults,
  onContactSupport,
}: {
  faqs: FAQItem[];
  expandedFAQs: Set<string>;
  onToggle: (id: string) => void;
  searchQuery: string;
  showNoResults: boolean;
  onContactSupport: () => void;
}) {
  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const words = query.trim().split(/\s+/);
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="help-center-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (showNoResults) {
    return (
      <div className="help-center-no-results">
        <i className="ri-search-line" style={{ fontSize: 48, marginBottom: 16 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          Không tìm thấy kết quả
        </h3>
        <p style={{ fontSize: 14, color: '#71717a', marginBottom: 20 }}>
          Không có câu hỏi nào phù hợp với "{searchQuery}"
        </p>
        <button onClick={onContactSupport} className="btn btn-secondary">
          <i className="ri-customer-service-2-line" style={{ marginRight: 8 }} />
          Liên hệ hỗ trợ
        </button>
      </div>
    );
  }

  return (
    <div className="help-center-faq-list">
      {faqs.map((faq) => {
        const isExpanded = expandedFAQs.has(faq.id);

        return (
          <div key={faq.id} className="help-center-faq-item">
            <button
              onClick={() => onToggle(faq.id)}
              className="help-center-faq-question"
              aria-expanded={isExpanded}
            >
              <span>{highlightText(faq.question, searchQuery)}</span>
              <i
                className={isExpanded ? 'ri-subtract-line' : 'ri-add-line'}
                style={{
                  fontSize: 18,
                  color: isExpanded ? '#f5d393' : '#71717a',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="help-center-faq-answer-wrapper"
                >
                  <div className="help-center-faq-answer">
                    {highlightText(faq.answer, searchQuery)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default HelpCenter;
