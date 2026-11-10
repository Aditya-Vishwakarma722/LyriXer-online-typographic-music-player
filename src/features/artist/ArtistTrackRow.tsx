import React from 'react';
import { Play, ShieldCheck } from 'lucide-react';
import type { ArtistTrack } from '../../types/artist';
import './ArtistTrackRow.css';

interface ArtistTrackRowProps {
  track: ArtistTrack;
  index: number;
  isSelected: boolean;
  isPlaying: boolean;
  onSelectTrack: (track: ArtistTrack) => void;
}

export const ArtistTrackRow: React.FC<ArtistTrackRowProps> = ({
  track,
  index,
  isSelected,
  isPlaying,
  onSelectTrack,
}) => {
  return (
    <div
      className={`artist-track-row ${isSelected ? 'selected' : ''} ${isPlaying ? 'playing' : ''}`}
      onClick={() => onSelectTrack(track)}
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
      {/* Index or Active Playing Equalizer Indicator */}
      <div className="track-number-col">
        {isPlaying ? (
          <div className="playing-bars" aria-label="Now Playing">
            <span className="bar bar-1" />
            <span className="bar bar-2" />
            <span className="bar bar-3" />
          </div>
        ) : (
          <span className="track-index">{(index + 1).toString().padStart(2, '0')}</span>
        )}
        <div className="track-play-hover">
          <Play size={13} fill="currentColor" />
        </div>
      </div>

      {/* Video Thumbnail */}
      {track.thumbnailUrl && (
        <div className="track-thumb-col">
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="track-thumb-img"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Title & Metadata */}
      <div className="track-info-col">
        <div className="track-title-line">
          <span className="track-title">{track.title}</span>
          {track.featuredArtist && (
            <span className="track-featured">ft. {track.featuredArtist}</span>
          )}
          {track.isOfficial && (
            <span className="track-official-tag" title="Official Music Video">
              <ShieldCheck size={11} />
              <span>Official Video</span>
            </span>
          )}
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
        {track.views && <span className="track-views">{track.views}</span>}
        <span className="track-duration">{track.durationFormatted}</span>
      </div>
    </div>
  );
};
