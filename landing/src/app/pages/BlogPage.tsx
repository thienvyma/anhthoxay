import { renderSection } from '../sections/render';
import { LazySection } from '../components/LazySection';
import type { PageData } from '../types';

export function BlogPage({ page }: { page?: PageData }) {
  return (
    <section style={{ 
      minHeight: '100vh',
      background: 'transparent',
      paddingTop: 80
    }}>
      {/* Render all sections from page data */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {page?.sections
          ?.filter((s) => s.kind !== 'FAB_ACTIONS') // FAB rendered separately in app.tsx
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((s, index) => {
            const rendered = renderSection(s);
            if (!rendered) return null;
            
            // Lazy load sections after first 2
            const shouldLazy = index >= 2;
            
            return shouldLazy ? (
              <LazySection key={s.id} rootMargin="300px">
                <div style={{ marginBottom: 40 }}>{rendered}</div>
              </LazySection>
            ) : (
              <div key={s.id} style={{ marginBottom: 40 }}>{rendered}</div>
            );
          })}
      </div>
    </section>
  );
}
