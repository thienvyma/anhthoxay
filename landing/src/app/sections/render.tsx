import { lazy, Suspense } from 'react';
import type { Section } from '../types';
import { tokens } from '@app/shared';
import ReactMarkdown from 'react-markdown'; // Keep for BlogPost content
import { SimpleMarkdown } from '../utils/simpleMarkdown'; // Lightweight for RICH_TEXT

// Lazy load all sections for better performance
const EnhancedHero = lazy(() => import('./EnhancedHero').then(m => ({ default: m.EnhancedHero })));
const HeroSimple = lazy(() => import('./HeroSimple').then(m => ({ default: m.HeroSimple })));
const EnhancedTestimonials = lazy(() => import('./EnhancedTestimonials').then(m => ({ default: m.EnhancedTestimonials })));
const StatsSection = lazy(() => import('./StatsSection').then(m => ({ default: m.StatsSection })));
const SpecialOffers = lazy(() => import('./SpecialOffers').then(m => ({ default: m.SpecialOffers })));
const ReservationForm = lazy(() => import('./ReservationForm').then(m => ({ default: m.ReservationForm })));
const ContactInfo = lazy(() => import('./ContactInfo').then(m => ({ default: m.ContactInfo })));
const GallerySlideshow = lazy(() => import('./GallerySlideshow').then(m => ({ default: m.GallerySlideshow })));
const Gallery = lazy(() => import('./Gallery').then(m => ({ default: m.Gallery })));
const FeaturedMenu = lazy(() => import('./FeaturedMenu').then(m => ({ default: m.FeaturedMenu })));
const FeaturedBlogPosts = lazy(() => import('./FeaturedBlogPosts').then(m => ({ default: m.FeaturedBlogPosts })));
const OpeningHours = lazy(() => import('./OpeningHours').then(m => ({ default: m.OpeningHours })));
const SocialMedia = lazy(() => import('./SocialMedia').then(m => ({ default: m.SocialMedia })));
const Features = lazy(() => import('./Features').then(m => ({ default: m.Features })));
const FooterSocial = lazy(() => import('./FooterSocial').then(m => ({ default: m.FooterSocial })));
const QuickContact = lazy(() => import('./QuickContact').then(m => ({ default: m.QuickContact })));
// New sections
const Stats = lazy(() => import('./Stats').then(m => ({ default: m.Stats })));
const MissionVision = lazy(() => import('./MissionVision').then(m => ({ default: m.MissionVision })));
const CoreValues = lazy(() => import('./CoreValues').then(m => ({ default: m.CoreValues })));
const CallToAction = lazy(() => import('./CallToAction').then(m => ({ default: m.CallToAction })));
const BlogList = lazy(() => import('./BlogList').then(m => ({ default: m.BlogList })));

// Loading fallback component
const SectionLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    opacity: 0.5,
  }}>
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      border: `3px solid ${tokens.color.border}`,
      borderTopColor: tokens.color.primary,
      animation: 'spin 0.8s linear infinite',
    }} />
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
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <Gallery data={data} />
        </Suspense>
      );

    case 'FEATURED_MENU':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <FeaturedMenu data={data} />
        </Suspense>
      );

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
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <SpecialOffers data={data} />
        </Suspense>
      );

    case 'RESERVATION_FORM':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <ReservationForm data={data} />
        </Suspense>
      );

    case 'CONTACT_INFO':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <ContactInfo data={data} />
        </Suspense>
      );

    case 'GALLERY_SLIDESHOW':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <GallerySlideshow data={data} />
        </Suspense>
      );

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
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <OpeningHours data={data} />
        </Suspense>
      );

    case 'SOCIAL_MEDIA':
      return (
        <Suspense key={section.id} fallback={<SectionLoader />}>
          <SocialMedia data={data} />
        </Suspense>
      );

    case 'FEATURES':
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

    case 'RICH_TEXT':
      return (
        <section 
          key={section.id}
          style={{
            maxWidth: 1200,
            margin: '80px auto',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(26, 27, 30, 0.6) 0%, rgba(19, 19, 22, 0.4) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(245, 211, 147, 0.1)',
              borderRadius: 16,
              padding: '48px 40px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            className="rich-text-content"
          >
            <div
              style={{
                lineHeight: 1.8,
                color: 'rgba(255,255,255,0.85)',
                fontSize: 16,
              }}
            >
              {/* Support both 'html' (raw HTML) and 'content' (markdown) */}
              {data.html ? (
                <div dangerouslySetInnerHTML={{ __html: data.html }} />
              ) : (
                <SimpleMarkdown>{data.content || ''}</SimpleMarkdown>
              )}
            </div>
          </div>

          <style>{`
            .rich-text-content h1,
            .rich-text-content h2,
            .rich-text-content h3,
            .rich-text-content h4 {
              font-family: 'Playfair Display', serif;
              color: ${tokens.color.primary};
              font-weight: 700;
              margin-top: 32px;
              margin-bottom: 16px;
              line-height: 1.3;
            }

            .rich-text-content h1 { font-size: 36px; }
            .rich-text-content h2 { font-size: 28px; }
            .rich-text-content h3 { font-size: 22px; }
            .rich-text-content h4 { font-size: 18px; }

            .rich-text-content h1:first-child,
            .rich-text-content h2:first-child,
            .rich-text-content h3:first-child,
            .rich-text-content h4:first-child {
              margin-top: 0;
            }

            .rich-text-content p {
              margin-bottom: 20px;
              line-height: 1.8;
            }

            .rich-text-content ul,
            .rich-text-content ol {
              margin: 20px 0;
              padding-left: 24px;
            }

            .rich-text-content li {
              margin-bottom: 12px;
              line-height: 1.7;
            }

            .rich-text-content li strong {
              color: ${tokens.color.primary};
              font-weight: 600;
            }

            .rich-text-content a {
              color: ${tokens.color.primary};
              text-decoration: none;
              border-bottom: 1px solid rgba(245, 211, 147, 0.3);
              transition: all 0.3s ease;
            }

            .rich-text-content a:hover {
              border-bottom-color: ${tokens.color.primary};
            }

            .rich-text-content blockquote {
              border-left: 4px solid ${tokens.color.primary};
              padding-left: 20px;
              margin: 24px 0;
              font-style: italic;
              color: rgba(255,255,255,0.7);
            }

            .rich-text-content code {
              background: rgba(0,0,0,0.3);
              padding: 2px 8px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: ${tokens.color.primary};
            }

            .rich-text-content pre {
              background: rgba(0,0,0,0.5);
              padding: 20px;
              border-radius: 8px;
              overflow-x: auto;
              margin: 24px 0;
            }

            .rich-text-content pre code {
              background: none;
              padding: 0;
            }

            .rich-text-content img {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              margin: 24px 0;
              box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            }

            .rich-text-content hr {
              border: none;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(245, 211, 147, 0.3), transparent);
              margin: 40px 0;
            }

            @media (max-width: 768px) {
              .rich-text-content h1 { font-size: 28px; }
              .rich-text-content h2 { font-size: 24px; }
              .rich-text-content h3 { font-size: 20px; }
              .rich-text-content h4 { font-size: 16px; }
            }
          `}</style>
        </section>
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

    case 'CTA':
      return (
        <div key={section.id} style={{ maxWidth: 1200, margin: '80px auto', padding: '0 16px' }}>
          <div
            style={{
              padding: '60px 40px',
              background: `linear-gradient(135deg, ${tokens.color.surface}, rgba(19,19,22,0.8))`,
              borderRadius: tokens.radius.xl,
              border: `2px solid ${tokens.color.primary}40`,
              textAlign: 'center',
            }}
          >
          {data.title && (
            <h2
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                color: tokens.color.primary,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              {data.title}
            </h2>
          )}
          {data.description && (
            <p
              style={{
                fontSize: 18,
                color: tokens.color.muted,
                marginBottom: 32,
                maxWidth: 600,
                margin: '0 auto 32px',
                lineHeight: 1.7,
              }}
            >
              {data.description}
            </p>
          )}
          {data.buttonText && (
            <a
              href={data.buttonLink || '#'}
              style={{
                display: 'inline-block',
                padding: '16px 40px',
                background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                color: '#111',
                textDecoration: 'none',
                borderRadius: tokens.radius.pill,
                fontSize: 18,
                fontWeight: 700,
                boxShadow: tokens.shadow.lg,
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {data.buttonText}
            </a>
          )}
          </div>
        </div>
      );

    default:
      // Silently skip unknown/unsupported section types
      // This prevents errors when admin creates new section types
      // that landing hasn't implemented yet
      return null;
  }
}


