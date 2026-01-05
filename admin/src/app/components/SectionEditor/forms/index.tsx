/**
 * SectionEditor Forms Index
 * Exports renderFormFields function that routes to individual form components
 * Requirements: 3.1, 3.3
 */

import React from 'react';
import { tokens } from '../../../../theme';
import type { SectionKind } from '../types';
import type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn, OnImagePickFn } from './shared';

// Import all form components
import { HeroForm } from './HeroForm';
import { HeroSimpleForm } from './HeroSimpleForm';
import { CTAForm } from './CTAForm';
import { RichTextForm } from './RichTextForm';
import { BannerForm } from './BannerForm';
import { ContactInfoForm } from './ContactInfoForm';
import { TestimonialsForm } from './TestimonialsForm';
import { StatsForm } from './StatsForm';
import { FeaturesForm } from './FeaturesForm';
import { FeaturedBlogPostsForm } from './FeaturedBlogPostsForm';
import { MissionVisionForm } from './MissionVisionForm';
import { SocialMediaForm } from './SocialMediaForm';
import { FooterSocialForm } from './FooterSocialForm';
import { QuickContactForm } from './QuickContactForm';
import { FABActionsForm } from './FABActionsForm';
import { QuoteFormForm } from './QuoteFormForm';
import { AboutForm } from './AboutForm';
import { FAQForm } from './FAQForm';
import { BlogListForm } from './BlogListForm';
import { QuoteCalculatorForm } from './QuoteCalculatorForm';
import { ServicesForm } from './ServicesForm';
import { MarketplaceForm } from './MarketplaceForm';
import { FeaturedSlideshowForm } from './FeaturedSlideshowForm';
import { MediaGalleryForm } from './MediaGalleryForm';
import { VideoShowcaseForm } from './VideoShowcaseForm';
import { FurnitureQuoteForm } from './FurnitureQuoteForm';

// Re-export types
export type { DataRecord, UpdateFieldFn, AddArrayItemFn, RemoveArrayItemFn, OnImagePickFn };

export function renderFormFields(
  kind: SectionKind,
  data: DataRecord,
  updateField: UpdateFieldFn,
  addArrayItem: AddArrayItemFn,
  removeArrayItem: RemoveArrayItemFn,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _onImagePick: OnImagePickFn
): React.JSX.Element {
  switch (kind) {
    case 'HERO':
      return <HeroForm data={data} updateField={updateField} />;

    case 'HERO_SIMPLE':
      return <HeroSimpleForm data={data} updateField={updateField} />;

    case 'CTA':
    case 'CALL_TO_ACTION':
      return <CTAForm data={data} updateField={updateField} />;

    case 'RICH_TEXT':
      return <RichTextForm data={data} updateField={updateField} />;

    case 'BANNER':
      return <BannerForm data={data} updateField={updateField} />;

    case 'CONTACT_INFO':
      return (
        <ContactInfoForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'TESTIMONIALS':
      return (
        <TestimonialsForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'STATS':
      return (
        <StatsForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'FEATURES':
    case 'CORE_VALUES':
      return (
        <FeaturesForm
          kind={kind}
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'FEATURED_BLOG_POSTS':
      return <FeaturedBlogPostsForm data={data} updateField={updateField} />;

    case 'MISSION_VISION':
      return <MissionVisionForm data={data} updateField={updateField} />;

    case 'SOCIAL_MEDIA':
      return (
        <SocialMediaForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'FOOTER_SOCIAL':
      return (
        <FooterSocialForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'QUICK_CONTACT':
      return <QuickContactForm data={data} updateField={updateField} />;

    case 'FAB_ACTIONS':
      return (
        <FABActionsForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'QUOTE_FORM':
      return (
        <QuoteFormForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'ABOUT':
      return <AboutForm data={data} updateField={updateField} />;

    case 'FAQ':
      return (
        <FAQForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'BLOG_LIST':
      return <BlogListForm data={data} updateField={updateField} />;

    case 'QUOTE_CALCULATOR':
      return <QuoteCalculatorForm data={data} updateField={updateField} />;

    case 'SERVICES':
      return (
        <ServicesForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    case 'MARKETPLACE':
      return <MarketplaceForm data={data} updateField={updateField} />;

    case 'FEATURED_SLIDESHOW':
      return <FeaturedSlideshowForm data={data} updateField={updateField} />;

    case 'MEDIA_GALLERY':
      return <MediaGalleryForm data={data} updateField={updateField} />;

    case 'VIDEO_SHOWCASE':
      return <VideoShowcaseForm data={data} updateField={updateField} />;

    case 'FURNITURE_QUOTE':
      return (
        <FurnitureQuoteForm
          data={data}
          updateField={updateField}
          addArrayItem={addArrayItem}
          removeArrayItem={removeArrayItem}
        />
      );

    default:
      return (
        <div style={{ color: tokens.color.muted, textAlign: 'center', padding: 40 }}>
          <i className="ri-code-line" style={{ fontSize: 48, display: 'block', marginBottom: 12 }} />
          Form editor cho section {kind} đang được phát triển.
        </div>
      );
  }
}
