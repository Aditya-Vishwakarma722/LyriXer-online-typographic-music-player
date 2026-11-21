import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Sparkles, X } from 'lucide-react';
import { cleanTrackTitle } from '../../utils/youtube';
import { CURATED_ARTISTS } from '../../services/artist/artistService';
import type { LyricTrack } from '../../services/lyrics/lrcParser';
import './EditorialMusicInfo.css';

interface EditorialMusicInfoProps {
  isVisible: boolean;
  isPaused: boolean;
  trackTitle: string;
  artistName?: string;
  lyrics: LyricTrack | null;
  activeLyricIndex: number;
  duration: number;
  playbackQuality?: string;
  onResumeOrPause: () => void;
  onOpenArtist?: () => void;
  onClose?: () => void;
}

export const EditorialMusicInfo: React.FC<EditorialMusicInfoProps> = ({
  isVisible,
  isPaused,
  trackTitle,
  artistName = '',
  lyrics,
  activeLyricIndex,
  duration,
  playbackQuality,
  onResumeOrPause,
  onOpenArtist,
  onClose,
}) => {
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

  // Badges calculation: locked between min 1080p and max 2160p
  const resolutionBadge = useMemo(() => {
    if (playbackQuality === 'hd2160' || playbackQuality === 'highres') {
      return '4K UHD (2160P)';
    }
    if (playbackQuality === 'hd1440') {
      return '2K QHD (1440P)';
    }
    if (playbackQuality === 'hd1080') {
      return '1080P FULL HD';
    }
    return duration > 0 ? '1080P - 2160P HD' : '1080P FULL HD';
  }, [playbackQuality, duration]);
  const durationShort = useMemo(() => {
    if (duration <= 0) return '0s';
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }, [duration]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="editorial-info-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Editorial Music Information"
      >
        {/* Atmospheric Cinematic Vignette Shading */}
        <div className="editorial-vignette-left" aria-hidden="true" />
        <div className="editorial-vignette-bottom" aria-hidden="true" />
        <div className="editorial-vignette-top" aria-hidden="true" />

        {/* Left Editorial Informational Stack */}
        <div className="editorial-info-stack">
          {/* Eyebrow Label */}
          <div className="editorial-eyebrow-row">
            <span className="editorial-eyebrow">
              {isPaused ? "YOU'RE WATCHING" : 'NOW PLAYING'}
            </span>
            {onClose && (
              <button
                type="button"
                className="editorial-collapse-btn"
                onClick={onClose}
                title="Hide music info panel (I)"
                aria-label="Close music info panel"
              >
                <X size={13} />
                <span>Hide</span>
              </button>
            )}
          </div>

          {/* Monumental Track Title */}
          <h1 className="editorial-main-title" title={displayTitle}>
            {displayTitle}
          </h1>

          {/* Subtitle / Season / Album Info (Clean bullet separator) */}
          <div className="editorial-meta-row">
            {artistData?.trackDetail?.album ? (
              <span className="editorial-subtitle">
                {displayArtist} • {artistData.trackDetail.album}
                {artistData.trackDetail.year ? ` (${artistData.trackDetail.year})` : ''}
              </span>
            ) : (
              <span className="editorial-subtitle">
                {displayArtist}
                {artistData?.profile?.genre ? ` • ${artistData.profile.genre}` : ''}
              </span>
            )}
          </div>

          {/* Badges Row */}
          <div className="editorial-badges-row">
            <span className="editorial-badge-box">{resolutionBadge}</span>
            <span className="editorial-badge-text">{durationShort}</span>
            <span className="editorial-badge-rating">
              <span className="rating-star">★</span>
              <span>
                {artistData?.trackDetail?.views
                  ? artistData.trackDetail.views.replace('views', '').trim()
                  : '9.8'}
              </span>
            </span>
            {lyrics && lyrics.lines && lyrics.lines.length > 0 && (
              <span className="editorial-badge-synced">LRCLIB SYNCED</span>
            )}
          </div>

          {/* Chapter / Current Lyric Header */}
          <div className="editorial-chapter-header">
            {currentLyricText ? (
              <p className="editorial-chapter-title">
                &ldquo;{currentLyricText}&rdquo;
              </p>
            ) : artistData?.trackDetail?.title ? (
              <p className="editorial-chapter-title">
                {artistData.trackDetail.title} (Official Master Release)
              </p>
            ) : (
              <p className="editorial-chapter-title">
                {displayTitle} (Official Master Visuals)
              </p>
            )}
          </div>

          {/* Detailed Synopsis Paragraph */}
          <p className="editorial-synopsis">
            {artistData?.profile?.bio
              ? artistData.profile.bio
              : `High-fidelity 24-bit acoustic master visuals synchronized in real-time with typographic lyrical phrasing. Powered by LyriXer Spatial Audio Engine unconstrained by conventional player frames.`}
          </p>

          {/* Action Row: Resume / Play Button & Artist Profile link */}
          <div className="editorial-action-row">
            <button
              type="button"
              className="editorial-resume-btn"
              onClick={onResumeOrPause}
              title={isPaused ? 'Resume playback (Space)' : 'Pause playback (Space)'}
            >
              {isPaused ? (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause size={14} fill="currentColor" />
                  <span>Pause</span>
                </>
              )}
            </button>

            {onOpenArtist && (
              <button
                type="button"
                className="editorial-artist-btn"
                onClick={onOpenArtist}
                title={`Explore ${displayArtist}'s verified discography`}
              >
                <Sparkles size={13} className="text-accent" />
                <span>Explore Artist</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

EditorialMusicInfo.displayName = 'EditorialMusicInfo';
