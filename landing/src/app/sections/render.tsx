import { lazy, Suspense } from 'react';
import type { Section } from '../types';
import { tokens } from '@app/shared';

// Lazy load all sections for better performance
const EnhancedHero = lazy(() => import('./EnhancedHero').then(m => ({ default: m.EnhancedHero })));
const HeroSimple = lazy(() => import('./HeroSimple').then(m => ({ default: m.HeroSimple })));
const EnhancedTestimonials = lazy(() => import('./EnhancedTestimonials').then(m => ({ default: m.EnhancedTestimonials })));
const ContactInfo = lazy(() => import('./ContactInfo').then(m => ({ default: m.ContactInfo })));
const FeaturedBlogPosts = lazy(() => import('./FeaturedBlogPosts').then(m => ({ default: m.FeaturedBlogPosts })));
const SocialMedia = lazy(() => import('./SocialMedia').then(m => ({ default: m.SocialMedia })));
const Features = lazy(() => import('./Features').then(m => ({ default: m.Features })));
const FooterSocial = lazy(() => import('./FooterSocial').then(m => ({ default: m.FooterSocial })));
const QuickContact = lazy(() => import('./QuickContact').then(m => ({ default: m.QuickContact })));
const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const MissionVision = lazy(() => import('./MissionVision').then(m => ({ default: m.MissionVision })));
const CoreValues = lazy(() => import('./CoreValues').then(m => ({ default: m.CoreValues })));
const CallToAction = lazy(() => import('./CallToAction').then(m => ({ default: m.CallToAction })));
const BlogList = lazy(() => import('./BlogList').then(m => ({ default: m.BlogList })));
const QuoteFormSection = lazy(() => import('./QuoteFormSection').then(m => ({ default: m.QuoteFormSection })));
const QuoteCalculatorSection = lazy(() => import('./QuoteCalculatorSection').then(m => ({ default: m.QuoteCalculatorSection })));
const MarketplaceSection = lazy(() => import('./MarketplaceSection').then(m => ({ default: m.MarketplaceSection })));
const FeaturedSlideshow = lazy(() => import('./FeaturedSlideshow').then(m => ({ default: m.FeaturedSlideshow })));
const MediaGallery = lazy(() => import('./MediaGallery').then(m => ({ default: m.MediaGallery })));
const RichTextSection = lazy(() => import('./RichTextSection').then(m => ({ default: m.RichTextSection })));
const VideoShowcase = lazy(() => import('./VideoShowcase').then(m => ({ default: m.VideoShowcase })));
const FurnitureQuoteSection = lazy(() => import('./FurnitureQuote').then(m => ({ default: m.FurnitureQuoteSection })));
const LegalContent = lazy(() => import('./LegalContent').then(m => ({ default: m.LegalContent })));

// Loading fallback component
const SectionLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    opacity: 0.5,
  }}>
    <div className="spinner-primary-sm" />
  </div>
);

/**
 * Central section renderer
 * Matches section types defined in admin/src/app/types.ts
 */
export function renderSection(section: Section) {
  // Parse JSON data if it's a string
  const data = typeof section.data === 'string' 
    ? JSON.parse(section.data) 
    : (section.data || {});

  switch (section.kind) {
    case 'HERO':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <EnhancedHero data={data} />
        </Suspense>
      );

    case 'HERO_SIMPLE':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <HeroSimple data={data} />
        </Suspense>
      );

    case 'GALLERY':
    case 'FEATURED_MENU':
      // These sections have been removed - not needed for ATH project
      return null;

    case 'TESTIMONIALS':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <EnhancedTestimonials data={data} />
        </Suspense>
      );

    case 'STATS':
    case 'STATISTICS': // Alias for STATS
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <Stats data={data} />
        </Suspense>
      );

    case 'SPECIAL_OFFERS':
    case 'RESERVATION_FORM':
      // These sections have been removed - not needed for ATH project
      return null;

    case 'CONTACT_INFO':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <ContactInfo data={data} />
        </Suspense>
      );

    case 'GALLERY_SLIDESHOW':
      // This section has been removed - not needed for ATH project
      return null;

    case 'FEATURED_BLOG_POSTS':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <FeaturedBlogPosts data={data} />
        </Suspense>
      );

    case 'BLOG_LIST':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <BlogList data={data} />
        </Suspense>
      );

    case 'OPENING_HOURS':
      // This section has been removed - not needed for ATH project
      return null;

    case 'SOCIAL_MEDIA':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <SocialMedia data={data} />
        </Suspense>
      );

    case 'FEATURES':
    case 'SERVICES': // Alias - use Features component for services
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <Features data={data} />
        </Suspense>
      );

    case 'MISSION_VISION':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <MissionVision data={data} />
        </Suspense>
      );

    case 'FAB_ACTIONS':
      // FAB is rendered separately in app.tsx with fixed position
      // Don't render it in page flow to avoid layout issues
      return null;

    case 'FOOTER_SOCIAL':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <FooterSocial data={data} />
        </Suspense>
      );

    case 'QUICK_CONTACT':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <QuickContact data={data} />
        </Suspense>
      );

    case 'CORE_VALUES':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <CoreValues data={data} />
        </Suspense>
      );

    case 'CALL_TO_ACTION':
    case 'CTA': // Alias for CALL_TO_ACTION
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <CallToAction data={data} />
        </Suspense>
      );

    case 'QUOTE_FORM':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <QuoteFormSection data={data} />
        </Suspense>
      );

    case 'QUOTE_CALCULATOR':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <QuoteCalculatorSection data={data} />
        </Suspense>
      );

    case 'MARKETPLACE':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <MarketplaceSection data={data} />
        </Suspense>
      );

    case 'FEATURED_SLIDESHOW':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <FeaturedSlideshow data={data} />
        </Suspense>
      );

    case 'MEDIA_GALLERY':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <MediaGallery data={data} />
        </Suspense>
      );

    case 'RICH_TEXT':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <RichTextSection data={data} />
        </Suspense>
      );

    case 'VIDEO_SHOWCASE':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <VideoShowcase data={data} />
        </Suspense>
      );

    case 'BANNER':
      return (
        <div
          key={section.id}
          style={{
            padding: 16,
            background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            color: '#111',
            textAlign: 'center',
            fontWeight: 600,
            fontSize: 15,
            borderRadius: tokens.radius.md,
            marginBottom: 20,
          }}
        >
          {data.href ? (
            <a
              href={data.href}
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {data.text}
            </a>
          ) : (
            data.text
          )}
        </div>
      );

    case 'FURNITURE_QUOTE':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <FurnitureQuoteSection data={data} />
        </Suspense>
      );

    case 'LEGAL_CONTENT':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <LegalContent data={data} />
        </Suspense>
      );

    default:
      // Silently skip unknown/unsupported section types
      // This prevents errors when admin creates new section types
      // that landing hasn't implemented yet
      return null;
  }
}


