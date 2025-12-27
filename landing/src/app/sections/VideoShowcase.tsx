import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { tokens } from '@app/shared';

interface VideoShowcaseProps {
  data: {
    title?: string;
    subtitle?: string;
    videoSource?: 'url' | 'youtube' | 'vimeo' | 'upload';
    videoUrl?: string;
    youtubeId?: string;
    vimeoId?: string;
    thumbnail?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    showControls?: boolean;
    aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16' | '21:9';
    maxWidth?: 'narrow' | 'default' | 'wide' | 'full';
    roundedCorners?: boolean;
    overlayText?: string;
    overlayPosition?: 'top' | 'center' | 'bottom';
  };
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(input: string): string {
  if (!input) return '';
  
  // Already just an ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  
  // youtube.com/watch?v=ID
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  
  // youtu.be/ID
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  
  // youtube.com/embed/ID
  const embedMatch = input.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  
  return input;
}

// Extract Vimeo video ID
function extractVimeoId(input: string): string {
  if (!input) return '';
  
  // Already just an ID (numbers only)
  if (/^\d+$/.test(input)) return input;
  
  // vimeo.com/ID
  const match = input.match(/vimeo\.com\/(\d+)/);
  if (match) return match[1];
  
  return input;
}

export function VideoShowcase({ data }: VideoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    title,
    subtitle,
    videoSource = 'url',
    videoUrl,
    youtubeId,
    vimeoId,
    thumbnail,
    autoplay = true,
    loop = true,
    muted = true,
    showControls = false,
    aspectRatio = '16:9',
    maxWidth = 'default',
    roundedCorners = true,
    overlayText,
    overlayPosition = 'center',
  } = data;

  // Calculate aspect ratio padding
  const aspectRatioPadding: Record<string, string> = {
    '16:9': '56.25%',
    '4:3': '75%',
    '1:1': '100%',
    '9:16': '177.78%',
    '21:9': '42.86%',
  };

  // Calculate max width
  const maxWidthValue: Record<string, string> = {
    narrow: '800px',
    default: '1000px',
    wide: '1200px',
    full: '100%',
  };

  // Handle autoplay for native video
  useEffect(() => {
    if (videoSource === 'url' || videoSource === 'upload') {
      if (autoplay && videoRef.current) {
        videoRef.current.play().catch(() => {
          // Autoplay blocked, show thumbnail
          setShowThumbnail(true);
        });
      }
    }
  }, [autoplay, videoSource]);

  // Handle play button click
  const handlePlay = () => {
    setIsPlaying(true);
    setShowThumbnail(false);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  // Render YouTube embed
  const renderYouTube = () => {
    const videoId = extractYouTubeId(youtubeId || '');
    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      loop: loop ? '1' : '0',
      mute: muted ? '1' : '0',
      controls: showControls ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      ...(loop ? { playlist: videoId } : {}),
    });

    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`}
        title={title || 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    );
  };

  // Render Vimeo embed
  const renderVimeo = () => {
    const videoId = extractVimeoId(vimeoId || '');
    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      loop: loop ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: showControls ? '1' : '0',
      background: !showControls ? '1' : '0',
    });

    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?${params.toString()}`}
        title={title || 'Video'}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    );
  };

  // Render native video
  const renderNativeVideo = () => {
    if (!videoUrl) return null;

    return (
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        controls={showControls}
        playsInline
        poster={thumbnail}
        onPlay={() => setShowThumbnail(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    );
  };

  // Check if we have a valid video source
  const hasVideo =
    (videoSource === 'youtube' && youtubeId) ||
    (videoSource === 'vimeo' && vimeoId) ||
    ((videoSource === 'url' || videoSource === 'upload') && videoUrl);

  if (!hasVideo) {
    return null;
  }

  return (
    <section
      style={{
        padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 24px)',
        background: 'transparent',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Header */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              marginBottom: 'clamp(24px, 5vw, 40px)',
            }}
          >
            {title && (
              <h2
                style={{
                  fontFamily: tokens.font.display,
                  fontSize: 'clamp(24px, 5vw, 42px)',
                  fontWeight: 700,
                  color: tokens.color.primary,
                  marginBottom: 'clamp(8px, 2vw, 16px)',
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                style={{
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  color: tokens.color.muted,
                  maxWidth: 600,
                  margin: '0 auto',
                  lineHeight: 1.6,
                  padding: '0 16px',
                }}
              >
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: maxWidthValue[maxWidth],
            margin: '0 auto',
            borderRadius: roundedCorners ? 'clamp(8px, 2vw, 16px)' : 0,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          {/* Aspect Ratio Container */}
          <div
            style={{
              position: 'relative',
              paddingBottom: aspectRatioPadding[aspectRatio],
              background: '#000',
            }}
          >
            {/* Video Content */}
            {videoSource === 'youtube' && renderYouTube()}
            {videoSource === 'vimeo' && renderVimeo()}
            {(videoSource === 'url' || videoSource === 'upload') && renderNativeVideo()}

            {/* Thumbnail Overlay (for native video) */}
            {(videoSource === 'url' || videoSource === 'upload') &&
              showThumbnail &&
              thumbnail &&
              !isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `url(${thumbnail}) center/cover`,
                    cursor: 'pointer',
                  }}
                  onClick={handlePlay}
                >
                  {/* Play Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 32px ${tokens.color.primary}60`,
                      cursor: 'pointer',
                    }}
                  >
                    <i
                      className="ri-play-fill"
                      style={{ fontSize: 36, color: '#111', marginLeft: 4 }}
                    />
                  </motion.div>
                </div>
              )}

            {/* Overlay Text */}
            {overlayText && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  padding: 24,
                  textAlign: 'center',
                  pointerEvents: 'none',
                  ...(overlayPosition === 'top'
                    ? { top: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }
                    : overlayPosition === 'bottom'
                      ? { bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }
                      : { top: '50%', transform: 'translateY(-50%)' }),
                }}
              >
                <p
                  style={{
                    fontFamily: tokens.font.display,
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    fontWeight: 700,
                    color: '#fff',
                    textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                    margin: 0,
                  }}
                >
                  {overlayText}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
