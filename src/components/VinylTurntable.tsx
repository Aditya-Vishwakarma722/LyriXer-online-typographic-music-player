import React from 'react';
import { Play, Sparkles, Disc3 } from 'lucide-react';
import './VinylTurntable.css';

export interface VinylTrackInfo {
  title: string;
  artist: string;
  artworkUrl?: string;
  duration?: number | string;
  badge?: string;
  lyricsSnippet?: string;
}

interface VinylTurntableProps {
  track: VinylTrackInfo;
  isPlaying?: boolean;
  onPlay?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VinylTurntable: React.FC<VinylTurntableProps> = React.memo<VinylTurntableProps>(({
  track,
  isPlaying = true,
  onPlay,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`vinyl-turntable-root size-${size} ${className}`} aria-label="Interactive Vinyl Turntable">
      {/* 1. Atmospheric Ambient Radial Glows */}
      <div className="turntable-ambient-glow" />
      <div className="turntable-radial-pulse" />

      {/* 2. The Turntable Deck Platter */}
      <div className="turntable-platter-base">
        {/* Tonearm Assembly */}
        <div className={`turntable-tonearm ${isPlaying ? 'tonearm-active' : ''}`}>
          <div className="tonearm-pivot">
            <div className="pivot-screw" />
          </div>
          <div className="tonearm-rod">
            <div className="tonearm-headshell">
              <div className="stylus-cartridge" />
              <div className="stylus-light" />
            </div>
          </div>
        </div>

        {/* 3. Spinning Vinyl Record */}
        <div className={`vinyl-disc ${isPlaying ? 'spinning' : 'paused'}`}>
          {/* Microgrooves overlay */}
          <div className="vinyl-grooves" />
          <div className="vinyl-sheen sheen-1" />
          <div className="vinyl-sheen sheen-2" />

          {/* Center Label with Album Artwork */}
          <div className="vinyl-center-label">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.title}
                className="label-artwork"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="label-fallback">
                <Disc3 size={32} className="fallback-icon" />
              </div>
            )}
            <div className="label-ring" />
            <div className="spindle-hole" />
          </div>
        </div>

        {/* 4. Interactive Hover / Play Overlay */}
        {onPlay && (
          <button
            type="button"
            className="turntable-play-trigger"
            onClick={onPlay}
            title={`Spin & Listen to ${track.title}`}
            aria-label={`Play ${track.title}`}
          >
            <div className="trigger-pill">
              <Play size={16} fill="currentColor" />
              <span>Spin Record</span>
            </div>
          </button>
        )}
      </div>

      {/* 5. Real-Time Sonic Ledger / Track Info Banner */}
      <div className="turntable-meta-banner">
        <div className="meta-badge-row">
          <span className="meta-live-badge">
            <span className="live-dot" />
            <span>{track.badge || 'ACOUSTIC VINYL STAGE'}</span>
          </span>
          <div className="meta-eq-indicator">
            <span className="eq-bar bar-1" />
            <span className="eq-bar bar-2" />
            <span className="eq-bar bar-3" />
            <span className="eq-bar bar-4" />
          </div>
        </div>

        <h3 className="meta-track-title">{track.title}</h3>
        <p className="meta-track-artist">{track.artist}</p>

        {track.lyricsSnippet && (
          <div className="meta-lyric-snippet">
            <Sparkles size={11} className="snippet-sparkle" />
            <span className="snippet-text">"{track.lyricsSnippet}"</span>
          </div>
        )}
      </div>
    </div>
  );
});

VinylTurntable.displayName = 'VinylTurntable';
