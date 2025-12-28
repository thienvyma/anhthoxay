/**
 * ImageRatioSlider Component
 * Slider for adjusting image/content ratio in split layouts
 * Requirements: 4.4
 */

import { tokens } from '@app/shared';

interface ImageRatioSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function ImageRatioSlider({ value, onChange }: ImageRatioSliderProps) {
  const ratio = value || 40;
  
  return (
    <div style={{ marginTop: 16 }}>
      <style>{`
        .ratio-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent});
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
          transition: transform 0.15s ease;
        }
        .ratio-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .ratio-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .ratio-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, ${tokens.color.primary}, ${tokens.color.accent});
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ color: tokens.color.text, fontSize: 13, fontWeight: 500 }}>
          Tỉ lệ Ảnh : Nội dung
        </label>
        <span style={{ 
          padding: '4px 10px', 
          background: `${tokens.color.primary}20`, 
          borderRadius: tokens.radius.sm,
          color: tokens.color.primary, 
          fontSize: 13, 
          fontWeight: 600 
        }}>
          {ratio}% : {100 - ratio}%
        </span>
      </div>
      
      {/* Custom slider with visual feedback */}
      <div style={{ position: 'relative', padding: '8px 0' }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 8,
          transform: 'translateY(-50%)',
          background: tokens.color.border,
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          {/* Filled portion */}
          <div style={{
            width: `${ratio}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${tokens.color.primary}, ${tokens.color.accent})`,
            transition: 'width 0.1s ease',
          }} />
        </div>
        
        {/* Actual range input */}
        <input
          type="range"
          min={15}
          max={70}
          step={1}
          value={ratio}
          onChange={(e) => onChange(Number(e.target.value))}
          className="ratio-slider"
          style={{
            width: '100%',
            height: 24,
            background: 'transparent',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
      </div>
      
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: tokens.color.muted }}>
          <i className="ri-image-line" style={{ marginRight: 4 }} />
          Ảnh nhỏ (15%)
        </span>
        <span style={{ fontSize: 11, color: tokens.color.muted }}>
          Ảnh lớn (70%)
          <i className="ri-image-line" style={{ marginLeft: 4 }} />
        </span>
      </div>
      
      <p style={{ marginTop: 8, fontSize: 12, color: tokens.color.muted }}>
        💡 Kéo thanh trượt để điều chỉnh tỉ lệ hiển thị giữa ảnh và nội dung
      </p>
    </div>
  );
}
