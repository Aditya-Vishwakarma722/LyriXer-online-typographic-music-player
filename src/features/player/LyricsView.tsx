import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import type { LyricTrack, LyricLine } from '../../services/lyrics/lrcParser';
import type { TypographyPreset } from '../../types/session';
import { Loader2, Music, Upload } from 'lucide-react';
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
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  activeIndex,
  isLoadingLyrics,
  typographyPreset = 'inter',
  fontSizeScale = 1,
  onSeekTo,
  onUploadLrcClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to center the active lyric line smoothly
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (isLoadingLyrics) {
    return (
      <div className="lyrics-loading-state">
        <Loader2 size={24} className="animate-spin text-accent" />
        <p className="loading-text">Synchronizing lyrics...</p>
      </div>
    );
  }

  if (!lyrics || !lyrics.lines || lyrics.lines.length === 0) {
    return (
      <div className="lyrics-empty-state">
        <div className="empty-icon-wrap">
          <Music size={28} />
        </div>
        <h3 className="empty-title">No Lyrics Found</h3>
        <p className="empty-desc">
          We couldn't automatically match synchronized lyrics for this track. You can upload an LRC
          file to follow along.
        </p>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Upload size={14} />}
          onClick={onUploadLrcClick}
        >
          Load .LRC File
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`lyrics-scroll-container preset-${typographyPreset}`}
      style={{ '--lyric-font-scale': fontSizeScale } as React.CSSProperties}
    >
      <div className="lyrics-content-wrapper">
        {/* Intro Instrumental spacer if activeIndex is -1 */}
        {activeIndex === -1 && lyrics.synced && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="lyric-line-item lyric-instrumental"
          >
            <span className="instrumental-dot" />
            <span>Intro Instrumental</span>
            <span className="instrumental-dot" />
          </motion.div>
        )}

        {lyrics.lines.map((line: LyricLine, index: number) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          const isNear = Math.abs(index - activeIndex) <= 2;

          let statusClass = 'lyric-far';
          if (isActive) statusClass = 'lyric-active';
          else if (isNear) statusClass = isPast ? 'lyric-past' : 'lyric-upcoming';

          return (
            <motion.div
              key={line.id}
              ref={isActive ? activeLineRef : undefined}
              className={`lyric-line-item ${statusClass}`}
              onClick={() => onSeekTo(line.timestamp)}
              whileHover={{ scale: 1.015, x: 4 }}
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
