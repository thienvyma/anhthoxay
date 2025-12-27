/**
 * VideoShowcaseForm Component
 * Form for VIDEO_SHOWCASE section type
 * Requirements: 3.2
 */

import { tokens } from '@app/shared';
import { Input, TextArea } from '../../Input';
import {
  InfoBanner,
  ImageSection,
  FormSection,
  SelectInput,
  CheckboxGroup,
} from './shared';
import type { DataRecord, UpdateFieldFn } from './shared';

interface VideoShowcaseFormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
}

const VIDEO_SOURCES = [
  { key: 'url', label: 'Link URL', icon: 'ri-link' },
  { key: 'youtube', label: 'YouTube', icon: 'ri-youtube-fill' },
  { key: 'vimeo', label: 'Vimeo', icon: 'ri-vimeo-fill' },
  { key: 'upload', label: 'Upload', icon: 'ri-upload-cloud-line' },
];

const PLAYBACK_OPTIONS = [
  { key: 'autoplay', label: 'Tự động phát', defaultValue: true },
  { key: 'loop', label: 'Lặp lại', defaultValue: true },
  { key: 'muted', label: 'Tắt tiếng (bắt buộc cho autoplay)', defaultValue: true },
  { key: 'showControls', label: 'Hiển thị controls', defaultValue: false },
];

const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '9:16', label: '9:16 (Portrait)' },
  { value: '21:9', label: '21:9 (Cinematic)' },
];

const MAX_WIDTHS = [
  { value: 'narrow', label: 'Hẹp (800px)' },
  { value: 'default', label: 'Mặc định (1000px)' },
  { value: 'wide', label: 'Rộng (1200px)' },
  { value: 'full', label: 'Toàn màn hình' },
];

const OVERLAY_POSITIONS = [
  { value: 'top', label: 'Trên' },
  { value: 'center', label: 'Giữa' },
  { value: 'bottom', label: 'Dưới' },
];

export function VideoShowcaseForm({ data, updateField }: VideoShowcaseFormProps) {
  const videoSource = (data.videoSource as string) || 'url';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <InfoBanner
        icon="ri-video-line"
        color="#EF4444"
        title="Video Showcase"
        description="Hiển thị video tự động chạy. Hỗ trợ upload file hoặc link YouTube/Vimeo."
      />

      <Input
        label="Tiêu đề (tùy chọn)"
        value={data.title || ''}
        onChange={(v) => updateField('title', v)}
        placeholder="Video Giới Thiệu"
        fullWidth
      />
      <TextArea
        label="Mô tả (tùy chọn)"
        value={data.subtitle || ''}
        onChange={(v) => updateField('subtitle', v)}
        placeholder="Khám phá quy trình làm việc chuyên nghiệp của chúng tôi"
        fullWidth
      />

      <FormSection
        icon="ri-film-line"
        iconColor="#EF4444"
        title="Nguồn Video"
        bgColor="rgba(239, 68, 68, 0.05)"
        borderColor="rgba(239, 68, 68, 0.2)"
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {VIDEO_SOURCES.map((source) => (
            <button
              key={source.key}
              type="button"
              onClick={() => updateField('videoSource', source.key)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                background: videoSource === source.key ? '#EF4444' : 'rgba(255,255,255,0.05)',
                color: videoSource === source.key ? '#fff' : tokens.color.muted,
                border: `1px solid ${videoSource === source.key ? '#EF4444' : tokens.color.border}`,
                borderRadius: tokens.radius.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className={source.icon} />
              {source.label}
            </button>
          ))}
        </div>

        {videoSource === 'url' && (
          <Input label="URL Video (MP4, WebM)" value={data.videoUrl || ''} onChange={(v) => updateField('videoUrl', v)} placeholder="https://example.com/video.mp4" fullWidth />
        )}
        {videoSource === 'youtube' && (
          <>
            <Input label="YouTube URL hoặc Video ID" value={data.youtubeId || ''} onChange={(v) => updateField('youtubeId', v)} placeholder="https://youtube.com/watch?v=xxxxx" fullWidth />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '8px 0 0' }}>Hỗ trợ: youtube.com/watch?v=ID, youtu.be/ID, hoặc chỉ Video ID</p>
          </>
        )}
        {videoSource === 'vimeo' && (
          <>
            <Input label="Vimeo URL hoặc Video ID" value={data.vimeoId || ''} onChange={(v) => updateField('vimeoId', v)} placeholder="https://vimeo.com/xxxxx" fullWidth />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '8px 0 0' }}>Hỗ trợ: vimeo.com/ID hoặc chỉ Video ID</p>
          </>
        )}
        {videoSource === 'upload' && (
          <>
            <Input label="URL Video đã upload" value={data.videoUrl || ''} onChange={(v) => updateField('videoUrl', v)} placeholder="Paste URL video sau khi upload" fullWidth />
            <p style={{ color: tokens.color.muted, fontSize: 12, margin: '8px 0 0' }}>Upload video lên hosting của bạn và paste URL vào đây. Hỗ trợ MP4, WebM.</p>
          </>
        )}
      </FormSection>

      <ImageSection label="Thumbnail (hiển thị trước khi video load)" value={data.thumbnail} onChange={(url) => updateField('thumbnail', url)} />

      <FormSection icon="ri-settings-3-line" title="Tùy chọn phát">
        <CheckboxGroup options={PLAYBACK_OPTIONS} data={data} updateField={updateField} />
      </FormSection>

      <FormSection icon="ri-layout-line" title="Bố cục">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectInput label="Tỷ lệ khung hình" value={(data.aspectRatio as string) || '16:9'} options={ASPECT_RATIOS} onChange={(v) => updateField('aspectRatio', v)} />
          <SelectInput label="Chiều rộng tối đa" value={(data.maxWidth as string) || 'default'} options={MAX_WIDTHS} onChange={(v) => updateField('maxWidth', v)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={data.roundedCorners !== false} onChange={(e) => updateField('roundedCorners', e.target.checked)} />
            <span style={{ color: tokens.color.text, fontSize: 13 }}>Bo góc video</span>
          </label>
        </div>
      </FormSection>

      <FormSection icon="ri-text" title="Overlay Text (tùy chọn)">
        <Input label="Text hiển thị trên video" value={data.overlayText || ''} onChange={(v) => updateField('overlayText', v)} placeholder="Chất lượng - Uy tín - Tận tâm" fullWidth />
        <div style={{ marginTop: 12 }}>
          <SelectInput label="Vị trí overlay" value={(data.overlayPosition as string) || 'center'} options={OVERLAY_POSITIONS} onChange={(v) => updateField('overlayPosition', v)} />
        </div>
      </FormSection>
    </div>
  );
}
