import React from 'react';
import './BrandLogo.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = React.memo<BrandLogoProps>(({
  size = 'md',
  showBadge = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`brand-logo-root size-${size} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Bespoke Geometric Acoustic Prism Soundmark */}
      <div className="brand-glyph-box" aria-hidden="true">
        <svg
          className="brand-glyph-svg"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="lyrixerGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EDE9FE" />
              <stop offset="45%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>

            <linearGradient id="lyrixerGradRing" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glyphGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Exterior Resonant Ring (Geometric Hex-Circle) */}
          <path
            d="M16 2.5L27 8.85V21.15L16 27.5L5 21.15V8.85L16 2.5Z"
            stroke="url(#lyrixerGradRing)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="glyph-outer-ring"
          />

          {/* Interlocking Dynamic Sound Waves forming stylized 'L' & 'X' */}
          <path
            d="M9 16L13 10L16 16L19 22L23 16"
            stroke="url(#lyrixerGradPrimary)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="glyph-wave-lead"
          />

          {/* Cross Acoustic Laser Needle */}
          <path
            d="M11 20L21 12"
            stroke="#EDE9FE"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="glyph-needle"
          />

          {/* Core Sound Aperture Sparkle Dot */}
          <circle
            cx="16"
            cy="16"
            r="1.8"
            fill="#FFFFFF"
            filter="url(#glyphGlow)"
            className="glyph-core-dot"
          />
        </svg>

        {/* Ambient Backlight Halo */}
        <div className="brand-glyph-ambient" />
      </div>

      {/* Brand Typographic Wordmark in Syne Geometric Editorial Font */}
      <span className="brand-wordmark-text">
        <span className="wordmark-lyri">Lyri</span>
        <span className="wordmark-x">X</span>
        <span className="wordmark-er">er</span>
      </span>

      {showBadge && <span className="brand-pro-tag">STUDIO</span>}
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';
