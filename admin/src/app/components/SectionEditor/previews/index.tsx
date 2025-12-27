import React from 'react';
import type { SectionKind } from '../types';
import { HeroPreview } from './HeroPreview';
import { HeroSimplePreview } from './HeroSimplePreview';
import { CTAPreview } from './CTAPreview';
import { RichTextPreview } from './RichTextPreview';
import { BannerPreview } from './BannerPreview';
import { ContactInfoPreview } from './ContactInfoPreview';
import { TestimonialsPreview } from './TestimonialsPreview';
import { StatsPreview } from './StatsPreview';
import { FeaturesPreview } from './FeaturesPreview';
import { FeaturedBlogPostsPreview } from './FeaturedBlogPostsPreview';
import { MissionVisionPreview } from './MissionVisionPreview';
import { SocialMediaPreview } from './SocialMediaPreview';
import { FooterSocialPreview } from './FooterSocialPreview';
import { QuickContactPreview } from './QuickContactPreview';
import { FABActionsPreview } from './FABActionsPreview';
import { QuoteFormPreview } from './QuoteFormPreview';
import { QuoteCalculatorPreview } from './QuoteCalculatorPreview';
import { AboutPreview } from './AboutPreview';
import { FAQPreview } from './FAQPreview';
import { BlogListPreview } from './BlogListPreview';
import { ServicesPreview } from './ServicesPreview';
import { MarketplacePreview } from './MarketplacePreview';
import { FeaturedSlideshowPreview } from './FeaturedSlideshowPreview';
import { MediaGalleryPreview } from './MediaGalleryPreview';
import { VideoShowcasePreview } from './VideoShowcasePreview';
import { FurnitureQuotePreview } from './FurnitureQuotePreview';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataRecord = Record<string, any>;

export function renderPreview(kind: SectionKind, data: DataRecord): React.JSX.Element {
  switch (kind) {
    case 'HERO':
      return <HeroPreview data={data} />;
    case 'HERO_SIMPLE':
      return <HeroSimplePreview data={data} />;
    case 'CTA':
    case 'CALL_TO_ACTION':
      return <CTAPreview data={data} />;
    case 'RICH_TEXT':
      return <RichTextPreview data={data} />;
    case 'BANNER':
      return <BannerPreview data={data} />;
    case 'CONTACT_INFO':
      return <ContactInfoPreview data={data} />;
    case 'TESTIMONIALS':
      return <TestimonialsPreview data={data} />;
    case 'STATS':
      return <StatsPreview data={data} />;
    case 'FEATURES':
    case 'CORE_VALUES':
      return <FeaturesPreview data={data} />;
    case 'FEATURED_BLOG_POSTS':
      return <FeaturedBlogPostsPreview data={data} />;
    case 'MISSION_VISION':
      return <MissionVisionPreview data={data} />;
    case 'SOCIAL_MEDIA':
      return <SocialMediaPreview data={data} />;
    case 'FOOTER_SOCIAL':
      return <FooterSocialPreview data={data} />;
    case 'QUICK_CONTACT':
      return <QuickContactPreview data={data} />;
    case 'FAB_ACTIONS':
      return <FABActionsPreview data={data} />;
    case 'QUOTE_FORM':
      return <QuoteFormPreview data={data} />;
    case 'QUOTE_CALCULATOR':
      return <QuoteCalculatorPreview data={data} />;
    case 'ABOUT':
      return <AboutPreview data={data} />;
    case 'FAQ':
      return <FAQPreview data={data} />;
    case 'BLOG_LIST':
      return <BlogListPreview data={data} />;
    case 'SERVICES':
      return <ServicesPreview data={data} />;
    case 'MARKETPLACE':
      return <MarketplacePreview data={data} />;
    case 'FEATURED_SLIDESHOW':
      return <FeaturedSlideshowPreview data={data} />;
    case 'MEDIA_GALLERY':
      return <MediaGalleryPreview data={data} />;
    case 'VIDEO_SHOWCASE':
      return <VideoShowcasePreview data={data} />;
    case 'FURNITURE_QUOTE':
      return <FurnitureQuotePreview data={data} />;
    default:
      return (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          <i className="ri-eye-off-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Preview chưa có cho section {kind}
        </div>
      );
  }
}
