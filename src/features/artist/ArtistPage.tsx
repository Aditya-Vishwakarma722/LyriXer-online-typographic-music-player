import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Play,
} from 'lucide-react';
import { ArtistTrackRow } from './ArtistTrackRow';
import { ArtistService } from '../../services/artist/artistService';
import type { ArtistProfile, ArtistTrack } from '../../types/artist';
import type { VideoSource } from '../../types/session';
import './ArtistPage.css';

interface ArtistPageProps {
  initialArtistName?: string;
  initialArtistId?: string;
  activeSession: VideoSource | null;
  onSelectTrack: (track: ArtistTrack) => void;
  onBackToHome: () => void;
  onBackToPlayer?: () => void;
  onOpenPlayer?: () => void;
}

type CatalogueCategory = 'all' | 'popular';

export const ArtistPage: React.FC<ArtistPageProps> = ({
  initialArtistName,
  initialArtistId,
  activeSession,
  onSelectTrack,
  onBackToHome,
  onBackToPlayer,
  onOpenPlayer,
}) => {
  const targetArtistName = initialArtistName || initialArtistId || 'Juice WRLD';
  const [activeCategory, setActiveCategory] = useState<CatalogueCategory>('all');
  const [profile, setProfile] = useState<ArtistProfile>(() =>
    ArtistService.getArtistByName(targetArtistName)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    // Fetch dynamic high-resolution photo, bio and live official music videos from web
    ArtistService.fetchArtistProfile(targetArtistName)
      .then((resolved) => {
        if (!isCancelled) {
          setProfile(resolved);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [targetArtistName]);

  // Filter songs by category
  const displayedTracks =
    activeCategory === 'popular'
      ? profile.tracks.slice(0, 6)
      : profile.tracks;

  return (
    <div className="artist-cinematic-page">
      {/* 1. Extended Full-Screen Backdrop: Upscaled Clear Quality Artist Image covering entire screen (100vw x 100vh) */}
      <div className="artist-bg-viewport" aria-hidden="true">
        <motion.img
          key={profile.heroImageUrl}
          src={profile.heroImageUrl}
          alt={profile.name}
          className="artist-bg-photo"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Soft atmospheric gradients for text legibility without box backgrounds */}
        <div className="artist-gradient-left" />
        <div className="artist-gradient-bottom" />
        <div className="artist-vignette-overlay" />
      </div>

      {/* 2. Previous Editorial Design in Transparent Overlay Mode (No Element Box Backgrounds) */}
      <div className="artist-stage-left">
        {/* Top Minimal Navigation Bar */}
        <header className="artist-top-bar">
          <div className="artist-nav-left">
            {onBackToPlayer && (
              <button
                type="button"
                className="artist-return-btn primary"
                onClick={onBackToPlayer}
                title="Return to active player session"
              >
                <ArrowLeft size={14} />
                <span>Back to Player</span>
              </button>
            )}

            <button
              type="button"
              className="artist-return-btn"
              onClick={onBackToHome}
              title="Return to LyriXer Home"
            >
              {!onBackToPlayer && <ArrowLeft size={14} />}
              <span>Home</span>
            </button>
          </div>

          {/* Understated Artist Spotlight Pill */}
          <div className="artist-focus-badge">
            <Sparkles size={12} className="text-accent" />
            <span>Artist Spotlight</span>
          </div>
        </header>

        {/* Artist Information (Upper Left) */}
        <section className="artist-info-header">
          <div className="artist-badges-row">
            {profile.verified && (
              <span className="artist-verified-tag">
                <CheckCircle2 size={12} className="text-accent" />
                <span>Official Artist</span>
              </span>
            )}
            <span className="artist-genre-label">{profile.genre}</span>
          </div>

          <h1 className="artist-headline-name">{profile.name}</h1>

          {profile.monthlyListeners && (
            <div className="artist-listeners-tag">
              <span>{profile.monthlyListeners}</span>
            </div>
          )}

          {profile.bio && (
            <p className="artist-description-text">{profile.bio}</p>
          )}

          {profile.youtubeChannelUrl && (
            <a
              href={profile.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="artist-channel-link"
            >
              <span>Explore {profile.name} on YouTube</span>
              <ExternalLink size={12} />
            </a>
          )}
        </section>

        {/* Music Catalogue Categories */}
        <div className="catalogue-category-tabs">
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Official Music Videos ({profile.tracks.length})
          </button>
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveCategory('popular')}
          >
            Top Hits
          </button>
        </div>

        {/* Vertically Scrollable Catalogue of Songs */}
        <section className="artist-catalogue-pane" aria-label="Music Catalogue">
          {isLoading && profile.tracks.length === 0 ? (
            <div className="artist-loading-pane">
              <div className="loading-spinner" />
              <span>Fetching {profile.name}'s official music videos...</span>
            </div>
          ) : (
            <div className="artist-tracklist-scroll">
              {displayedTracks.map((track: ArtistTrack, index: number) => {
                const isSelected = activeSession?.sourceId === track.videoId;
                const isPlaying = isSelected;

                return (
                  <ArtistTrackRow
                    key={track.id || `${track.videoId}-${index}`}
                    track={track}
                    index={index}
                    isSelected={isSelected}
                    isPlaying={isPlaying}
                    onSelectTrack={onSelectTrack}
                  />
                );
              })}
            </div>
          )}

          {/* Footnote with photo attribution */}
          <footer className="artist-footer-meta">
            <Sparkles size={12} className="text-accent" />
            <span>{profile.imageAttribution}</span>
          </footer>
        </section>
      </div>

      {/* Floating Active Player Session Dock */}
      {activeSession && (onOpenPlayer || onBackToPlayer) && (
        <div className="artist-active-session-dock">
          <div className="dock-meta-group">
            <span className="dock-live-dot" />
            <div className="dock-titles">
              <span className="dock-song">{activeSession.title}</span>
              <span className="dock-artist">{activeSession.artist || 'Now Playing'}</span>
            </div>
          </div>
          <button
            type="button"
            className="dock-resume-btn"
            onClick={onBackToPlayer || onOpenPlayer}
            title="Resume playback in player"
          >
            <span>Resume Player</span>
            <Play size={12} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtistPage;
