import React, { useState } from 'react';
import { Play, ShieldCheck, Users, Disc3, Flame, Music2 } from 'lucide-react';
import type { ArtistTrack } from '../../types/artist';
import './ArtistTrackRow.css';

interface ArtistTrackRowProps {
  track: ArtistTrack;
  index: number;
  isSelected: boolean;
  isPlaying: boolean;
  onSelectTrack: (track: ArtistTrack) => void;
  onHoverTrack?: (track: ArtistTrack) => void;
  isTopHitsTab?: boolean;
}

export const ArtistTrackRow: React.FC<ArtistTrackRowProps> = ({
  track,
  index,
  isSelected,
  isPlaying,
  onSelectTrack,
  onHoverTrack,
  isTopHitsTab = false,
}) => {
  const displayRank = track.rank || index + 1;
  const [thumbSrc, setThumbSrc] = useState<string>(track.thumbnailUrl || '');
  const [hasError, setHasError] = useState(false);

  const handleImgError = () => {
    if (thumbSrc.includes('hqdefault.jpg') && track.videoId) {
      setThumbSrc(`https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`);
    } else {
      setHasError(true);
    }
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // YouTube returns a 120x90 image (gray TV with 3 dots) when a thumbnail is missing
    if (img.naturalWidth <= 120 && img.naturalHeight <= 90) {
      if (thumbSrc.includes('hqdefault.jpg') && track.videoId) {
        setThumbSrc(`https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`);
      } else {
        setHasError(true);
      }
    }
  };

  return (
    <div
      className={`artist-track-row ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''} ${
        isTopHitsTab ? 'is-top-hit-row' : ''
      }`}
      onClick={() => onSelectTrack(track)}
      onMouseEnter={() => onHoverTrack?.(track)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectTrack(track);
        }
      }}
      aria-label={`Play ${track.title}`}
    >
      {/* Index / Top Hit Rank or Active Playing Equalizer Indicator */}
      <div className="track-number-col">
        {isPlaying ? (
          <div className="playing-bars" aria-label="Now Playing">
            <span className="bar bar-1" />
            <span className="bar bar-2" />
            <span className="bar bar-3" />
          </div>
        ) : isTopHitsTab ? (
          <span className="track-rank-badge" title={`Top Hit #${displayRank}`}>
            {displayRank <= 3 ? <Flame size={10} className="rank-flame" /> : null}
            #{displayRank}
          </span>
        ) : (
          <span className="track-index">{(index + 1).toString().padStart(2, '0')}</span>
        )}
        <div className="track-play-hover">
          <Play size={13} fill="currentColor" />
        </div>
      </div>

      {/* Video Thumbnail with Anti-Placeholder Fallback */}
      <div className="track-thumb-col">
        {!hasError && thumbSrc ? (
          <img
            src={thumbSrc}
            alt={track.title}
            className="track-thumb-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImgError}
            onLoad={handleImgLoad}
          />
        ) : (
          <div className="track-thumb-fallback" title={track.title}>
            <Music2 size={15} className="thumb-fallback-icon" />
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div className="track-info-col">
        <div className="track-title-line">
          <span className="track-title">{track.title}</span>
          {track.featuredArtist && (
            <span className="track-featured">ft. {track.featuredArtist}</span>
          )}
          {track.trackType === 'collab' || (track.featuredArtist && !track.trackType) ? (
            <span className="track-collab-tag" title="Collaboration / Feature">
              <Users size={11} />
              <span>Collab</span>
            </span>
          ) : track.trackType === 'audio' ? (
            <span className="track-audio-tag" title="Official Audio / Album Track">
              <Disc3 size={11} />
              <span>Official Audio</span>
            </span>
          ) : track.isOfficial ? (
            <span className="track-official-tag" title="Official Music Video">
              <ShieldCheck size={11} />
              <span>Official Video</span>
            </span>
          ) : null}
        </div>

        {track.album && (
          <div className="track-album-sub">
            <span>{track.album}</span>
            {track.year && <span> &middot; {track.year}</span>}
          </div>
        )}
      </div>

      {/* Duration and Views */}
      <div className="track-action-col">
        {track.views && (
          <span className={`track-views-badge ${isTopHitsTab ? 'prominent' : ''}`}>
            {isTopHitsTab && <Flame size={10} className="views-flame" />}
            <span>{track.views}</span>
          </span>
        )}
        <span className="track-duration">{track.durationFormatted}</span>
      </div>
    </div>
  );
};
