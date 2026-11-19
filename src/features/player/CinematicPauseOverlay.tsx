import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Settings,
  Minimize2,
  X,
  Play,
  Sparkles,
} from 'lucide-react';
import { cleanTrackTitle } from '../../utils/youtube';
import { formatDuration } from '../../utils/formatters';
import { CURATED_ARTISTS } from '../../services/artist/artistService';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import './CinematicPauseOverlay.css';

interface CinematicPauseOverlayProps {
  isVisible: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  trackTitle: string;
  artistName?: string;
  lyrics: LyricTrack | null;
  activeLyricIndex: number;
  lyricsVisible: boolean;
  isFullScreen: boolean;
  onResume: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleLyrics: () => void;
  onOpenLrclibSearch: () => void;
  onOpenSettings?: () => void;
  onToggleFullScreen: () => void;
  onOpenArtist?: () => void;
  onExit?: () => void;
}

export const CinematicPauseOverlay: React.FC<CinematicPauseOverlayProps> = ({
  isVisible,
  currentTime,
  duration,
  volume,
  muted,
  trackTitle,
  artistName = '',
  lyrics,
  activeLyricIndex,
  lyricsVisible,
  isFullScreen,
  onResume,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLyrics,
  onOpenLrclibSearch,
  onOpenSettings,
  onToggleFullScreen,
  onOpenArtist,
  onExit,
}) => {
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [scrubHoverTime, setScrubHoverTime] = useState<number | null>(null);
  const [scrubHoverX, setScrubHoverX] = useState<number>(0);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Parse clean title and artist
  const parsed = useMemo(() => {
    return cleanTrackTitle(trackTitle);
  }, [trackTitle]);

  const displayTitle = parsed.title || trackTitle;
  const displayArtist = artistName || parsed.artist || 'LyriXer Master Artist';

  // Find curated artist metadata and track bio
  const artistData = useMemo(() => {
    const clean = displayArtist.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, profile] of Object.entries(CURATED_ARTISTS)) {
      if (clean === key || clean.includes(key) || key.includes(clean)) {
        // Try finding track details within this artist's discography
        const trackDetail = profile.tracks.find((t) => {
          const tClean = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
          const pClean = displayTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
          return tClean.includes(pClean) || pClean.includes(tClean);
        });

        return {
          profile,
          trackDetail,
        };
      }
    }
    return null;
  }, [displayArtist, displayTitle]);

  // Current active lyric line text
  const currentLyricText = useMemo(() => {
    if (!lyrics || !lyrics.lines || activeLyricIndex < 0 || activeLyricIndex >= lyrics.lines.length) {
      return null;
    }
    return lyrics.lines[activeLyricIndex].text.trim();
  }, [lyrics, activeLyricIndex]);

  // Formatted duration and progress
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const durationFormatted = formatDuration(duration);
  const currentTimeFormatted = formatDuration(currentTime);

  // Badges calculation
  const resolutionBadge = duration > 0 ? '4K UHD' : '1080P HD';
  const durationShort = useMemo(() => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [duration]);

  // Handle timeline scrubbing
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = hoverX / rect.width;
    setScrubHoverTime(ratio * duration);
    setScrubHoverX(hoverX);
  };

  const handleScrubberMouseLeave = () => {
    setScrubHoverTime(null);
  };

  // Rewind & Fast Forward 10 seconds
  const handleRewind10 = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeek(Math.max(0, currentTime - 10));
  };

  const handleForward10 = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeek(Math.min(duration, currentTime + 10));
  };

  // Keyboard shortcut listener while paused
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === ' ' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onResume();
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 10));
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        onSeek(Math.min(duration, currentTime + 10));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onToggleFullScreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentTime, duration, onResume, onSeek, onToggleMute, onToggleFullScreen]);

  // Picture in picture handler
  const handleTogglePiP = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const videoEl = document.querySelector('video');
      if (videoEl && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoEl.requestPictureInPicture();
        }
      }
    } catch {
      // Ignore PiP permissions error if unsupported
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cinematic-pause-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={onResume}
        role="dialog"
        aria-label="Playback Paused"
      >
        {/* Cinematic Atmospheric Vignette Shadows */}
        <div className="pause-vignette-left" aria-hidden="true" />
        <div className="pause-vignette-bottom" aria-hidden="true" />
        <div className="pause-vignette-top" aria-hidden="true" />

        {/* Top Centered Subtle Episode / Track Monograph */}
        <div className="pause-top-monograph" onClick={(e) => e.stopPropagation()}>
          <span className="top-monograph-title">
            {displayTitle} — {displayArtist}
          </span>
          {onExit && (
            <button
              type="button"
              className="pause-exit-btn"
              onClick={onExit}
              title="Exit player"
              aria-label="Exit player"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ============================================================== */}
        {/* LEFT EDITORIAL INFORMATIONAL STACK                             */}
        {/* ============================================================== */}
        <div className="pause-editorial-stack" onClick={(e) => e.stopPropagation()}>
          {/* Eyebrow Label */}
          <div className="pause-eyebrow">
            <span>YOU'RE WATCHING</span>
          </div>

          {/* Monumental Track Title */}
          <h1 className="pause-main-title">{displayTitle}</h1>

          {/* Subtitle / Season / Album Info */}
          <div className="pause-meta-row">
            {artistData?.trackDetail?.album ? (
              <span className="pause-subtitle">
                {displayArtist} &bull; {artistData.trackDetail.album}
                {artistData.trackDetail.year ? ` (${artistData.trackDetail.year})` : ''}
              </span>
            ) : (
              <span className="pause-subtitle">
                {displayArtist}
                {artistData?.profile?.genre ? ` &bull; ${artistData.profile.genre}` : ''}
              </span>
            )}
          </div>

          {/* Badges Row */}
          <div className="pause-badges-row">
            <span className="pause-badge-box">{resolutionBadge}</span>
            <span className="pause-badge-text">{durationShort}</span>
            <span className="pause-badge-rating">
              <span className="rating-star">★</span>
              <span>
                {artistData?.trackDetail?.views
                  ? artistData.trackDetail.views.replace('views', '').trim()
                  : '9.8'}
              </span>
            </span>
            {lyrics && lyrics.lines && lyrics.lines.length > 0 && (
              <span className="pause-badge-synced">LRCLIB SYNCED</span>
            )}
          </div>

          {/* Chapter / Current Lyric Header */}
          <div className="pause-chapter-header">
            {currentLyricText ? (
              <p className="pause-chapter-title">
                &ldquo;{currentLyricText}&rdquo;
              </p>
            ) : artistData?.trackDetail?.title ? (
              <p className="pause-chapter-title">
                {artistData.trackDetail.title} (Official Master Release)
              </p>
            ) : (
              <p className="pause-chapter-title">
                {displayTitle} (Official Master Visuals)
              </p>
            )}
          </div>

          {/* Detailed Synopsis Paragraph */}
          <p className="pause-synopsis">
            {artistData?.profile?.bio
              ? artistData.profile.bio
              : `High-fidelity 24-bit acoustic master visuals synchronized in real-time with typographic lyrical phrasing. Powered by LyriXer Spatial Audio Engine unconstrained by conventional player frames.`}
          </p>

          {/* Action Row: Resume Button & Artist Profile link */}
          <div className="pause-action-row">
            <button
              type="button"
              className="pause-resume-btn"
              onClick={onResume}
              title="Resume playback (Space)"
            >
              <Play size={14} fill="currentColor" />
              <span>Resume</span>
            </button>

            {onOpenArtist && (
              <button
                type="button"
                className="pause-artist-btn"
                onClick={onOpenArtist}
                title={`Explore ${displayArtist}'s verified discography`}
              >
                <Sparkles size={13} className="text-accent" />
                <span>Explore Artist</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM TIMELINE SCRUBBER & CONTROLS BAR (Matches Screenshot)  */}
        {/* ============================================================== */}
        <div className="pause-bottom-bar" onClick={(e) => e.stopPropagation()}>
          {/* Full-Width Scrub Timeline Bar */}
          <div
            ref={scrubberRef}
            className="pause-timeline-scrubber"
            onClick={handleScrubberClick}
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
            role="slider"
            aria-label="Seek timeline"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
            tabIndex={0}
          >
            {/* Scrubber Hover Time Preview Tooltip */}
            {scrubHoverTime !== null && (
              <div
                className="pause-scrub-tooltip"
                style={{ left: `${scrubHoverX}px` }}
              >
                {formatDuration(scrubHoverTime)}
              </div>
            )}

            <div className="pause-timeline-track">
              {/* Violet Progress Line */}
              <div
                className="pause-timeline-progress"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Controls Buttons Row */}
          <div className="pause-controls-row">
            {/* Left Controls: Rewind 10, Forward 10, Volume, Timecode */}
            <div className="pause-controls-left">
              {/* Rewind 10 Seconds */}
              <button
                type="button"
                className="pause-icon-btn pause-seek-10"
                onClick={handleRewind10}
                title="Rewind 10 seconds (J / ←)"
                aria-label="Rewind 10 seconds"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4V1L8 5l4 4V6a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
                  <text
                    x="12"
                    y="14.5"
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="700"
                    fill="currentColor"
                    stroke="none"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    10
                  </text>
                </svg>
              </button>

              {/* Forward 10 Seconds */}
              <button
                type="button"
                className="pause-icon-btn pause-seek-10"
                onClick={handleForward10}
                title="Fast forward 10 seconds (L / →)"
                aria-label="Fast forward 10 seconds"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4V1l4 4-4 4V6a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z" />
                  <text
                    x="12"
                    y="14.5"
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="700"
                    fill="currentColor"
                    stroke="none"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    10
                  </text>
                </svg>
              </button>

              {/* Volume / Mute Button & Flyout Slider */}
              <div
                className="pause-volume-container"
                onMouseEnter={() => setIsVolumeHovered(true)}
                onMouseLeave={() => setIsVolumeHovered(false)}
              >
                <button
                  type="button"
                  className="pause-icon-btn pause-volume-btn"
                  onClick={onToggleMute}
                  title={muted ? 'Unmute (M)' : 'Mute (M)'}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? (
                    <VolumeX size={22} />
                  ) : volume < 50 ? (
                    <Volume1 size={22} />
                  ) : (
                    <Volume2 size={22} />
                  )}
                </button>

                {/* Flyout Volume Slider */}
                <div className={`pause-volume-slider-wrap ${isVolumeHovered ? 'visible' : ''}`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      if (muted) onToggleMute();
                      onVolumeChange(Number(e.target.value));
                    }}
                    className="pause-volume-slider"
                    aria-label="Adjust volume"
                  />
                </div>
              </div>

              {/* Timecode */}
              <div className="pause-timecode" aria-label="Playback Timecode">
                <span className="time-current">{currentTimeFormatted}</span>
                <span className="time-divider">/</span>
                <span className="time-duration">{durationFormatted}</span>
              </div>
            </div>

            {/* Right Controls: Subtitles/Lyrics, Audio/Server, Settings, PiP, Fullscreen */}
            <div className="pause-controls-right">
              {/* Subtitles / Lyrics Toggle Button */}
              <button
                type="button"
                className={`pause-icon-btn ${lyricsVisible ? 'active-accent' : ''}`}
                onClick={onToggleLyrics}
                title={lyricsVisible ? 'Hide lyrics' : 'Show lyrics'}
                aria-label="Toggle Lyrics Subtitles"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M7 10h4M13 10h4M7 14h2M11 14h6" strokeLinecap="round" />
                </svg>
              </button>

              {/* Audio Channels / LRCLIB Search Modal Button */}
              <button
                type="button"
                className="pause-icon-btn"
                onClick={onOpenLrclibSearch}
                title="Search lyrics and synchronize audio on LRCLIB"
                aria-label="LRCLIB Audio and Subtitle Engine"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="4" y="4" width="16" height="7" rx="2" />
                  <circle cx="8" cy="7.5" r="1" fill="currentColor" />
                  <circle cx="11" cy="7.5" r="1" fill="currentColor" />
                  <rect x="4" y="13" width="16" height="7" rx="2" />
                  <circle cx="8" cy="16.5" r="1" fill="currentColor" />
                  <circle cx="11" cy="16.5" r="1" fill="currentColor" />
                </svg>
              </button>

              {/* Settings Gear Cog */}
              <button
                type="button"
                className="pause-icon-btn"
                onClick={onOpenSettings || onOpenLrclibSearch}
                title="Player preferences and sync settings"
                aria-label="Settings"
              >
                <Settings size={22} />
              </button>

              {/* Picture-in-Picture / Windowed mini-player */}
              <button
                type="button"
                className="pause-icon-btn"
                onClick={handleTogglePiP}
                title="Picture-in-Picture Mini-Player"
                aria-label="Picture-in-Picture"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <rect
                    x="12"
                    y="11"
                    width="8"
                    height="7"
                    rx="1.5"
                    fill="currentColor"
                    fillOpacity="0.3"
                  />
                </svg>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                className="pause-icon-btn"
                onClick={onToggleFullScreen}
                title={isFullScreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                aria-label="Toggle Fullscreen"
              >
                {isFullScreen ? (
                  <Minimize2 size={22} />
                ) : (
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

CinematicPauseOverlay.displayName = 'CinematicPauseOverlay';
