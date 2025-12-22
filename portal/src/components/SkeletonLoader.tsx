/**
 * SkeletonLoader components for loading states
 * Requirements: 18.1 - Display skeleton loaders when data is loading
 */

import { type CSSProperties } from 'react';

interface SkeletonBaseProps {
  className?: string;
  style?: CSSProperties;
}

// Base skeleton element with shimmer animation
export function SkeletonBase({ className = '', style }: SkeletonBaseProps) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        background: 'linear-gradient(90deg, #1a1a1f 25%, #27272a 50%, #1a1a1f 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

// Card skeleton for project/bid cards
export function CardSkeleton() {
  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header with badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SkeletonBase style={{ width: 80, height: 24 }} />
        <SkeletonBase style={{ width: 60, height: 20, borderRadius: 9999 }} />
      </div>

      {/* Title */}
      <SkeletonBase style={{ width: '70%', height: 24 }} />

      {/* Description lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBase style={{ width: '100%', height: 14 }} />
        <SkeletonBase style={{ width: '85%', height: 14 }} />
      </div>

      {/* Meta info row */}
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <SkeletonBase style={{ width: 100, height: 16 }} />
        <SkeletonBase style={{ width: 80, height: 16 }} />
        <SkeletonBase style={{ width: 90, height: 16 }} />
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 16,
          borderTop: '1px solid #27272a',
        }}
      >
        <SkeletonBase style={{ width: 120, height: 14 }} />
        <SkeletonBase style={{ width: 100, height: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}

// List skeleton for table/list views
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '16px 20px',
          borderBottom: '1px solid #27272a',
          background: '#1a1a1f',
        }}
      >
        <SkeletonBase style={{ width: 40, height: 16 }} />
        <SkeletonBase style={{ width: 150, height: 16 }} />
        <SkeletonBase style={{ width: 100, height: 16 }} />
        <SkeletonBase style={{ width: 80, height: 16 }} />
        <SkeletonBase style={{ width: 100, height: 16, marginLeft: 'auto' }} />
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            gap: 16,
            padding: '16px 20px',
            borderBottom: index < rows - 1 ? '1px solid #27272a' : 'none',
            alignItems: 'center',
          }}
        >
          <SkeletonBase style={{ width: 40, height: 14 }} />
          <SkeletonBase style={{ width: 180, height: 14 }} />
          <SkeletonBase style={{ width: 120, height: 14 }} />
          <SkeletonBase style={{ width: 70, height: 24, borderRadius: 9999 }} />
          <SkeletonBase style={{ width: 80, height: 32, borderRadius: 6, marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

// Form skeleton for form loading states
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Form title */}
      <SkeletonBase style={{ width: 200, height: 28 }} />

      {/* Form fields */}
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBase style={{ width: 100, height: 14 }} />
          <SkeletonBase style={{ width: '100%', height: 44 }} />
        </div>
      ))}

      {/* Submit button */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <SkeletonBase style={{ width: 120, height: 44, borderRadius: 8 }} />
        <SkeletonBase style={{ width: 100, height: 44, borderRadius: 8 }} />
      </div>
    </div>
  );
}

// Dashboard card skeleton
export function DashboardCardSkeleton() {
  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBase style={{ width: 100, height: 14 }} />
          <SkeletonBase style={{ width: 60, height: 32 }} />
        </div>
        <SkeletonBase style={{ width: 44, height: 44, borderRadius: 10 }} />
      </div>
      <div style={{ marginTop: 16 }}>
        <SkeletonBase style={{ width: 140, height: 12 }} />
      </div>
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div
      style={{
        background: '#131316',
        border: '1px solid #27272a',
        borderRadius: 12,
        padding: 24,
      }}
    >
      {/* Avatar and name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <SkeletonBase style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkeletonBase style={{ width: 150, height: 24 }} />
          <SkeletonBase style={{ width: 100, height: 16 }} />
        </div>
      </div>

      {/* Info rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonBase style={{ width: 80, height: 14 }} />
            <SkeletonBase style={{ width: 150, height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Page skeleton combining multiple elements
export function PageSkeleton({ type = 'list' }: { type?: 'list' | 'cards' | 'form' | 'dashboard' }) {
  if (type === 'dashboard') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Welcome section */}
        <div>
          <SkeletonBase style={{ width: 250, height: 32, marginBottom: 8 }} />
          <SkeletonBase style={{ width: 180, height: 16 }} />
        </div>

        {/* Stats cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <DashboardCardSkeleton key={index} />
          ))}
        </div>

        {/* Content section */}
        <ListSkeleton rows={3} />
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBase style={{ width: 200, height: 32 }} />
          <SkeletonBase style={{ width: 140, height: 40, borderRadius: 8 }} />
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 12 }}>
          <SkeletonBase style={{ width: 120, height: 40, borderRadius: 8 }} />
          <SkeletonBase style={{ width: 120, height: 40, borderRadius: 8 }} />
          <SkeletonBase style={{ width: 120, height: 40, borderRadius: 8 }} />
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <FormSkeleton fields={5} />
      </div>
    );
  }

  // Default: list type
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonBase style={{ width: 200, height: 32 }} />
        <SkeletonBase style={{ width: 140, height: 40, borderRadius: 8 }} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <SkeletonBase style={{ width: 200, height: 40, borderRadius: 8 }} />
        <SkeletonBase style={{ width: 120, height: 40, borderRadius: 8 }} />
      </div>

      {/* List */}
      <ListSkeleton rows={8} />
    </div>
  );
}

// Inline text skeleton
export function TextSkeleton({ width = 100, height = 16 }: { width?: number | string; height?: number }) {
  return <SkeletonBase style={{ width, height, display: 'inline-block' }} />;
}

// Avatar skeleton
export function AvatarSkeleton({ size = 40 }: { size?: number }) {
  return <SkeletonBase style={{ width: size, height: size, borderRadius: '50%' }} />;
}

// Button skeleton
export function ButtonSkeleton({ width = 100, height = 40 }: { width?: number; height?: number }) {
  return <SkeletonBase style={{ width, height, borderRadius: 8 }} />;
}
