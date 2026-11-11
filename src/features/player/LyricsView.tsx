import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LyricTrack, LyricLine } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import { Loader2, Music, Upload, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import './LyricsView.css';

interface LyricsViewProps {
  lyrics: LyricTrack | null;
  activeIndex: number;
  isLoadingLyrics: boolean;
  typographyPreset?: TypographyPreset;
  fontSizeScale?: number; // 0.8 to 1.4
  onSeekTo: (seconds: number) => void;
  onUploadLrcClick: () => void;
  onSearchLrclibClick?: () => void;
  onAutoSync?: () => void;
  onAlignVocalsToNow?: () => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  activeIndex,
  isLoadingLyrics,
  typographyPreset = 'kinetic',
  fontSizeScale = 1,
  onSeekTo,
  onUploadLrcClick,
  onSearchLrclibClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll for list/stack presets
  useEffect(() => {
    if (typographyPreset !== 'kinetic' && activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, typographyPreset]);

  if (isLoadingLyrics) {
    return (
      <div className="lyrics-loading-state">
        <Loader2 size={28} className="animate-spin text-accent" />
        <p className="loading-text">Fetching synchronized lyrics from LRCLIB...</p>
      </div>
    );
  }

  if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
    return (
      <div className="lyrics-empty-state">
        <div className="empty-icon-wrap">
          <Music size={28} />
        </div>
        <h3 className="empty-title">No Synchronized Lyrics Found</h3>
        <p className="empty-desc">
          We couldn't automatically find lyrics on LRCLIB for this video. You can search LRCLIB or load a custom .lrc file.
        </p>
        <div className="empty-actions-row">
          {onSearchLrclibClick && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Search size={14} />}
              onClick={onSearchLrclibClick}
            >
              Search LRCLIB
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Upload size={14} />}
            onClick={onUploadLrcClick}
          >
            Load .LRC File
          </Button>
        </div>
      </div>
    );
  }

  // Active line
  const activeLine: LyricLine | null = activeIndex >= 0 ? lyrics.lines[activeIndex] : null;

  // 1. KINETIC SCREEN-FILLING ANIME/CINEMATIC EDIT MODE (Single Active Lyric Focus)
  if (typographyPreset === 'kinetic') {
    return (
      <div
        className="kinetic-stage-root"
        style={{ '--lyric-font-scale': fontSizeScale } as React.CSSProperties}
      >
        <div className="kinetic-stage-container">
          {/* Screen-filling giant kinetic hero phrase - ONLY active line, no blurred clutter */}
          <div className="kinetic-active-viewport">
            <AnimatePresence mode="wait">
              {activeLine ? (
                <motion.div
                  key={`kline-${activeIndex}-${activeLine.timestamp}`}
                  initial={{ opacity: 0, scale: 0.94, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.04, y: -20, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="kinetic-hero-phrase"
                >
                  <h1 className="kinetic-hero-text">{activeLine.text || '♪'}</h1>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // 2. FOCUS STACK & CLASSIC PRESETS
  return (
    <div
      ref={containerRef}
      className={`lyrics-scroll-container preset-${typographyPreset}`}
      style={{ '--lyric-font-scale': fontSizeScale } as React.CSSProperties}
    >
      <div className="lyrics-content-wrapper">
        {lyrics.lines.map((line: LyricLine, index: number) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex !== -1 && index < activeIndex;
          const distance = activeIndex === -1 ? 99 : Math.abs(index - activeIndex);
          const clampedDistance = Math.min(distance, 4);

          let statusClass = 'lyric-far';
          if (isActive) statusClass = 'lyric-active';
          else if (distance <= 2) statusClass = isPast ? 'lyric-past' : 'lyric-upcoming';

          return (
            <motion.div
              key={line.id}
              ref={isActive ? activeLineRef : undefined}
              className={`lyric-line-item ${statusClass} dist-${clampedDistance}`}
              data-distance={clampedDistance}
              onClick={() => onSeekTo(line.timestamp)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSeekTo(line.timestamp);
                }
              }}
              title={`Jump to ${Math.floor(line.timestamp / 60)}:${(line.timestamp % 60).toFixed(0).padStart(2, '0')}`}
            >
              <span className="lyric-text">{line.text || '♪'}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
