import { ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazySection({ 
  children, 
  fallback = <SectionSkeleton />,
  rootMargin = '200px',
  threshold = 0.01,
}: LazySectionProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin,
    threshold,
  });
  
  return (
    <div ref={ref} style={{ minHeight: inView ? 'auto' : '400px' }}>
      {inView ? children : fallback}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div 
      style={{ 
        height: 400, 
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        animation: 'pulse 1.5s ease-in-out infinite',
        margin: '40px 0',
      }} 
    />
  );
}

