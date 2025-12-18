import { Component, ReactNode } from 'react';
import { tokens } from '@app/shared';
import { renderSection } from '../sections/render';
import { LazySection } from './LazySection';
import type { PageData, Section } from '../types';

// Error boundary to catch section render errors
class SectionErrorBoundary extends Component<
  { children: ReactNode; sectionId: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; sectionId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Section ${this.props.sectionId} error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface PageRendererProps {
  page: PageData | null;
  /** Number of sections to render immediately (rest are lazy loaded) */
  eagerSections?: number;
}

/**
 * Unified page renderer component
 * - Handles Hero sections without top padding
 * - Lazy loads sections after initial ones
 * - Shows empty state when no sections
 * - Consistent across all pages
 */
export function PageRenderer({ page, eagerSections = 2 }: PageRendererProps) {
  // Sort sections by order and filter FAB_ACTIONS (rendered separately)
  const sections: Section[] = (page?.sections || [])
    .filter((s) => s.kind !== 'FAB_ACTIONS')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Check if first section is a Hero type (needs no top padding)
  const firstSectionIsHero =
    sections.length > 0 && ['HERO', 'HERO_SIMPLE'].includes(sections[0].kind);

  // Empty state
  if (sections.length === 0) {
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: tokens.color.muted,
          paddingTop: '4rem',
        }}
      >
        <p>Trang này chưa có nội dung.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: firstSectionIsHero ? 0 : undefined }}>
      {sections.map((section, index) => {
        // Lazy load sections after initial eager ones
        const shouldLazy = index >= eagerSections;

        const content = (
          <SectionErrorBoundary sectionId={section.id}>
            {renderSection(section)}
          </SectionErrorBoundary>
        );

        return shouldLazy ? (
          <LazySection key={section.id} rootMargin="300px">
            <section>{content}</section>
          </LazySection>
        ) : (
          <section key={section.id}>{content}</section>
        );
      })}
    </div>
  );
}
