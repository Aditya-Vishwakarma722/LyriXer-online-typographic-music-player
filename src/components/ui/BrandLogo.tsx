import React from 'react';
import './BrandLogo.css';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  badgeText?: string;
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = React.memo<BrandLogoProps>(({
  size = 'md',
  showBadge = false,
  badgeText,
  showSubtitle = false,
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
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Diamond/Cyan Laser Gradient */}
            <linearGradient id="lyrixerGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#00F2FE" />
            </linearGradient>

            {/* Crossbeam Laser Gradient */}
            <linearGradient id="lyrixerGradLaser" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F2FE" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Precision Reticle Ring Gradient */}
            <linearGradient id="lyrixerGradRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#0284C7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.85" />
            </linearGradient>

            {/* Glowing Optical Bloom Filter */}
            <filter id="glyphGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Exterior Precision Chamfered Octagonal Frame */}
          <path
            d="M11 3.5 H25 L32.5 11 V25 L25 32.5 H11 L3.5 25 V11 Z"
            stroke="url(#lyrixerGradRing)"
            strokeWidth="1.25"
            strokeLinejoin="round"
            className="glyph-outer-oct"
          />

          {/* 2. Cardinal Precision HUD Ticks */}
          <path d="M18 1.5 V4.5" stroke="#00F2FE" strokeWidth="1.2" strokeLinecap="round" className="glyph-hud-tick" />
          <path d="M18 31.5 V34.5" stroke="#00F2FE" strokeWidth="1.2" strokeLinecap="round" className="glyph-hud-tick" />
          <path d="M1.5 18 H4.5" stroke="#00F2FE" strokeWidth="1.2" strokeLinecap="round" className="glyph-hud-tick" />
          <path d="M31.5 18 H34.5" stroke="#00F2FE" strokeWidth="1.2" strokeLinecap="round" className="glyph-hud-tick" />

          {/* 3. Dotted Concentric Telemetry Frequency Orbit */}
          <circle
            cx="18"
            cy="18"
            r="11.5"
            stroke="rgba(0, 242, 254, 0.28)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            className="glyph-telemetry-circle"
          />

          {/* 4. Resonant Soundwave Lead Vector (Synthesizing 'L' & Acoustic Waveform) */}
          <path
            d="M8.5 23 L13 13.5 L18 19.5 L23 10.5 L27.5 23"
            stroke="url(#lyrixerGradPrimary)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="glyph-wave-lead"
          />

          {/* 5. Laser Diagonal Cross-Frequency Vector (Forming the iconic 'X') */}
          <path
            d="M10.5 23.5 L25.5 12.5"
            stroke="url(#lyrixerGradLaser)"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="glyph-laser-cross"
          />

          {/* 6. Central Acoustic Aperture Diamond Spark */}
          <polygon
            points="18,14.5 20.5,17 18,19.5 15.5,17"
            fill="#FFFFFF"
            filter="url(#glyphGlow)"
            className="glyph-core-diamond"
          />
          <circle
            cx="18"
            cy="17"
            r="1.2"
            fill="#00F2FE"
            className="glyph-core-aperture"
          />
        </svg>

        {/* Ambient Laser Plasma Backlight */}
        <div className="brand-glyph-ambient" />
      </div>

      {/* Brand Typographic Wordmark in Orbitron Cybernetic Display */}
      <div className="brand-wordmark-wrap">
        <span className="brand-wordmark-text">
          <span className="wordmark-lyri">LYRI</span>
          <span className="wordmark-x-wrap">
            <span className="wordmark-x">X</span>
            <span className="wordmark-x-glow" aria-hidden="true">X</span>
          </span>
          <span className="wordmark-er">ER</span>
        </span>
        {showSubtitle && (
          <span className="brand-wordmark-sub">SPATIAL VOCAL ENGINE</span>
        )}
      </div>

      {/* Cybernetic Telemetry / Spec Badge */}
      {showBadge && (
        <span className="brand-tech-badge">
          <span className="tech-badge-dot" />
          <span>{badgeText || 'SYS.01 // SPATIAL'}</span>
        </span>
      )}
    </div>
  );
});

BrandLogo.displayName = 'BrandLogo';
