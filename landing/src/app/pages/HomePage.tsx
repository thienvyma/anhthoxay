import { renderSection } from '../sections/render';
import { LazySection } from '../components/LazySection';
import type { PageData } from '../types';

export function HomePage({ page }: { page: PageData }) {
  // Sort sections by order and filter out empty/null renders
  const sortedSections = [...(page.sections || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  return (
    <>
      {sortedSections.map((s, index) => {
        const rendered = renderSection(s);
        // Skip null/empty sections to prevent blank spaces
        if (!rendered) return null;
        
        // First 2 sections: render immediately (Hero + first content section)
        // Rest: lazy load on scroll for better initial load performance
        const shouldLazy = index >= 2;
        
        return shouldLazy ? (
          <LazySection key={s.id} rootMargin="300px">
            <section>{rendered}</section>
          </LazySection>
        ) : (
          <section key={s.id}>{rendered}</section>
        );
      })}
    </>
  );
}


