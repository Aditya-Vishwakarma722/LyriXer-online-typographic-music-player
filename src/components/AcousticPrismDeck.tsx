import React, { useState, useEffect } from 'react';
import { Play, Sparkles, Radio, Activity, Volume2 } from 'lucide-react';
import './AcousticPrismDeck.css';

export interface PrismTrackInfo {
  title: string;
  artist: string;
  artworkUrl?: string;
  duration?: number | string;
  badge?: string;
  lyricsSnippet?: string;
}

interface AcousticPrismDeckProps {
  track: PrismTrackInfo;
  isPlaying?: boolean;
  onPlay?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AcousticPrismDeck: React.FC<AcousticPrismDeckProps> = React.memo<AcousticPrismDeckProps>(({
  track,
  isPlaying = true,
  onPlay,
  size = 'md',
}) => {
  // Generate random heights for the 16 equalizer bars to create an organic audio rhythm
  const [eqHeights, setEqHeights] = useState<number[]>([
    45, 75, 30, 90, 60, 85, 40, 100, 70, 50, 80, 65, 35, 95, 55, 70
  ]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setEqHeights(prev =>
        prev.map(() => 20 + Math.floor(Math.random() * 80))
      );
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`acoustic-prism-root size-${size}`} aria-label="Acoustic Spatial Audio Prism">
      {/* Background Ambient Violet Backlight */}
      <div className="prism-ambient-halo" />

      {/* Holographic Concentric Resonant Rings */}
      <div className="prism-radar-assembly">
        <div className="radar-ring ring-1" />
        <div className="radar-ring ring-2" />
        <div className="radar-ring ring-3" />
        <div className="radar-beam" />
      </div>

      {/* The Central Prismatic Hologram Disc */}
      <div className="prism-core-housing">
        {/* Outer Frosted Ring */}
        <div className="housing-frosted-bezel">
          {/* Cover Art Suspended in Glass */}
          <div className="housing-artwork-container">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={`${track.title} by ${track.artist}`}
                className="prism-artwork-image"
                loading="lazy"
              />
            ) : (
              <div className="prism-artwork-fallback">
                <Volume2 size={36} className="fallback-audio-icon" />
              </div>
            )}
            <div className="artwork-glass-sheen" />
          </div>

          {/* Interactive Play Button Hover Overlay */}
          <button
            type="button"
            className="prism-play-trigger"
            onClick={onPlay}
            title={`Play ${track.title} with synced lyrics`}
            aria-label={`Play ${track.title} with synced lyrics`}
          >
            <div className="play-trigger-pill">
              <Play size={18} className="play-icon-fill" fill="currentColor" />
              <span>Audition Spatial Sync</span>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic 16-Bar Spectrum Visualizer Deck */}
      <div className="prism-spectrum-deck">
        <div className="spectrum-bars-row" aria-hidden="true">
          {eqHeights.map((h, i) => (
            <div
              key={i}
              className="spectrum-bar-column"
              style={{
                height: `${h}%`,
                animationDelay: `${(i * 0.04).toFixed(2)}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Spatial Telemetry & Active Track Metadata Strip */}
      <div className="prism-telemetry-banner">
        <div className="telemetry-top-row">
          <div className="telemetry-badge">
            <span className="telemetry-pulse-dot" />
            <Radio size={11} className="telemetry-icon" />
            <span>{track.badge || '24-BIT / 96KHZ SPATIAL MATRIX'}</span>
          </div>

          <div className="telemetry-stat">
            <Activity size={11} className="telemetry-icon" />
            <span>DOLBY ATMOS SYNC</span>
          </div>
        </div>

        <h3 className="prism-track-title">{track.title}</h3>
        <p className="prism-track-artist">{track.artist}</p>

        {track.lyricsSnippet && (
          <div className="prism-lyrics-preview">
            <Sparkles size={11} className="lyrics-preview-sparkle" />
            <span className="lyrics-preview-text">"{track.lyricsSnippet}"</span>
          </div>
        )}
      </div>
    </div>
  );
});

AcousticPrismDeck.displayName = 'AcousticPrismDeck';
