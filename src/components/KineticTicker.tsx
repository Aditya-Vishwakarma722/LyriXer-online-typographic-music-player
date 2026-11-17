import React from 'react';
import './KineticTicker.css';

interface KineticTickerProps {
  items?: string[];
  speed?: 'normal' | 'slow' | 'fast';
  className?: string;
}

const DEFAULT_TICKER_ITEMS = [
  'REAL-TIME MILLISECOND VOCAL MATCHING',
  '100% PRIVATE LOCAL PROCESSING',
  'SPOTIFY-STYLE VERTICAL FOCUS STACK',
  'FULL-VIEWPORT YOUTUBE BACKDROP',
  'ZERO-CHROME IMMERSION',
  'FINE SYNC RUSH & DELAY CALIBRATION',
  'LRCLIB GLOBAL LYRICS ENGINE',
  'HIGH-DEFINITION MASTER PHOTOGRAPHY',
];

export const KineticTicker: React.FC<KineticTickerProps> = React.memo<KineticTickerProps>(({
  items = DEFAULT_TICKER_ITEMS,
  speed = 'normal',
  className = '',
}) => {
  return (
    <section className={`kinetic-ticker-root speed-${speed} ${className}`} aria-hidden="true">
      <div className="kinetic-ticker-track">
        {/* Double array for seamless endless loop */}
        {[...items, ...items].map((item, index) => (
          <div key={index} className="kinetic-ticker-item">
            <span className="ticker-sparkle">✦</span>
            <span className="ticker-label">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
});

KineticTicker.displayName = 'KineticTicker';
