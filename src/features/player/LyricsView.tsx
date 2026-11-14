import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LyricTrack, LyricLine } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import { Loader2, Music, Upload, Search, ChevronDown } from 'lucide-react';
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
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [translateY, setTranslateY] = useState(0);
  const [wheelOffset, setWheelOffset] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const wheelTimeoutRef = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  /**
   * Spotify-style centering:
   * Recalculates the exact vertical transform so the currently sung vocal line
   * is dead-center in the middle of the screen (50% Y of the viewport).
   * As the song progresses, the lines keep scrolling UPWARDS, keeping the vocal
   * line anchored in the center.
   */
  const updateCenterPosition = useCallback(() => {
    if (typographyPreset !== 'focus-stack') return;
    const stage = stageRef.current;
    if (!stage) return;

    const stageHeight = stage.clientHeight;
    // When activeIndex is -1 (intro preamble), center the upcoming first line
    const targetIdx = activeIndex >= 0 ? activeIndex : 0;
    const targetEl = lineRefs.current[targetIdx];

    if (targetEl) {
      const activeCenter = targetEl.offsetTop + targetEl.offsetHeight / 2;
      const targetY = stageHeight / 2 - activeCenter;
      setTranslateY(targetY);
    }
  }, [activeIndex, typographyPreset]);

  // Recalculate center position whenever activeIndex, font scale, or lyrics change
  useLayoutEffect(() => {
    updateCenterPosition();
  }, [updateCenterPosition, fontSizeScale, lyrics]);

  // Responsive window resize listener
  useEffect(() => {
    const handleResize = () => {
      updateCenterPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCenterPosition]);

  // Initial smooth mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
      updateCenterPosition();
    }, 60);
    return () => clearTimeout(timer);
  }, [updateCenterPosition]);

  // Automatically reset any user wheel offset when the next line begins
  useEffect(() => {
    setWheelOffset(0);
  }, [activeIndex]);

  // Allow manual scroll/wheel inspection with smooth auto-snap return
  const handleWheel = (e: React.WheelEvent) => {
    if (typographyPreset !== 'focus-stack') return;
    setWheelOffset((prev) => {
      const next = prev - e.deltaY;
      return Math.max(-900, Math.min(900, next));
    });

    if (wheelTimeoutRef.current) {
      window.clearTimeout(wheelTimeoutRef.current);
    }
    wheelTimeoutRef.current = window.setTimeout(() => {
      setWheelOffset(0);
    }, 2800);
  };

  // Touch support for mobile/trackpad drag
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || typographyPreset !== 'focus-stack') return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    touchStartY.current = currentY;

    setWheelOffset((prev) => Math.max(-900, Math.min(900, prev + delta)));

    if (wheelTimeoutRef.current) {
      window.clearTimeout(wheelTimeoutRef.current);
    }
    wheelTimeoutRef.current = window.setTimeout(() => {
      setWheelOffset(0);
    }, 2800);
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

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

  // 2. FOCUS STACK: SPOTIFY-STYLE VERTICALLY CENTERED CONTINUOUS AUTO-SCROLL
  return (
    <div
      ref={stageRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`lyrics-focus-stack-stage preset-${typographyPreset}`}
      style={{ '--lyric-font-scale': fontSizeScale } as React.CSSProperties}
    >
      <div
        ref={trackRef}
        className={`lyrics-focus-stack-track ${isInitialLoad ? 'no-transition' : ''}`}
        style={{
          transform: `translate3d(0, ${translateY + wheelOffset}px, 0)`,
        }}
      >
        {lyrics.lines.map((line: LyricLine, index: number) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex !== -1 && index < activeIndex;
          const distance = activeIndex === -1 ? 99 : Math.abs(index - activeIndex);

          let statusClass = 'lyric-upcoming';
          if (isActive) statusClass = 'lyric-active';
          else if (isPast) statusClass = 'lyric-past';

          const distClass = distance <= 4 ? `dist-${distance}` : 'dist-far';

          return (
            <div
              key={line.id}
              ref={(el) => {
                lineRefs.current[index] = el;
              }}
              className={`lyric-line-item ${statusClass} ${distClass}`}
              data-active={isActive}
              onClick={() => {
                setWheelOffset(0);
                onSeekTo(line.timestamp);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setWheelOffset(0);
                  onSeekTo(line.timestamp);
                }
              }}
              title={`Jump to ${Math.floor(line.timestamp / 60)}:${(line.timestamp % 60).toFixed(0).padStart(2, '0')}`}
            >
              <span className="lyric-text">{line.text || '♪'}</span>
            </div>
          );
        })}
      </div>

      {/* Spotify-style "Sync to Current" quick jump pill when user scrolled away */}
      <AnimatePresence>
        {wheelOffset !== 0 && activeIndex >= 0 && (
          <motion.button
            type="button"
            className="lyrics-sync-to-current-pill"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setWheelOffset(0);
              updateCenterPosition();
            }}
          >
            <ChevronDown size={14} className="sync-pill-icon" />
            <span>Sync to Current Line</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
