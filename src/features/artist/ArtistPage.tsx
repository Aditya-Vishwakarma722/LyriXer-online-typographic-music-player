import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  onBackToArtists?: () => void;
  onBackToPlayer?: () => void;
  onOpenPlayer?: () => void;
}

type CatalogueCategory = 'all' | 'popular' | 'videos' | 'collabs' | 'audio';

export const ArtistPage: React.FC<ArtistPageProps> = ({
  initialArtistName,
  initialArtistId,
  activeSession,
  onSelectTrack,
  onBackToHome,
  onBackToArtists,
  onBackToPlayer,
  onOpenPlayer,
}) => {
  const targetArtistName = initialArtistName || initialArtistId || 'Juice WRLD';
  const [activeCategory, setActiveCategory] = useState<CatalogueCategory>('all');
  const [profile, setProfile] = useState<ArtistProfile>(() =>
    ArtistService.getArtistByName(targetArtistName)
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const LOADING_STEPS = [
    'Scanning verified artist discography...',
    'Loading high-definition master photography...',
    'Synchronizing official music catalogue...',
  ];

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 750);

    const startTime = Date.now();

    // Fetch dynamic high-resolution photo, bio and live official music videos from web
    ArtistService.fetchArtistProfile(targetArtistName)
      .then((resolved) => {
        const elapsed = Date.now() - startTime;
        // Smooth authentic presentation window (650ms minimum)
        const minBufferMs = 650;
        const remaining = Math.max(0, minBufferMs - elapsed);
        setTimeout(() => {
          if (!isCancelled) {
            setProfile(resolved);
            setIsLoading(false);
          }
        }, remaining);
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      clearInterval(stepInterval);
    };
  }, [targetArtistName]);

  // Counts for category badges
  const videoCount = profile.tracks.filter(
    (t) => t.trackType === 'video' || (!t.trackType && t.isOfficial && !t.featuredArtist)
  ).length;

  const collabCount = profile.tracks.filter(
    (t) =>
      t.trackType === 'collab' ||
      Boolean(t.featuredArtist) ||
      /(?:\bfeat\b|\bft\b|\bwith\b|&)/i.test(t.title)
  ).length;

  const audioCount = profile.tracks.filter(
    (t) => t.trackType === 'audio' || (!t.featuredArtist && t.trackType !== 'video')
  ).length;

  // Filter songs by category
  const displayedTracks = (() => {
    switch (activeCategory) {
      case 'popular':
        return profile.tracks.slice(0, 8);
      case 'videos': {
        const v = profile.tracks.filter(
          (t) => t.trackType === 'video' || (!t.trackType && t.isOfficial && !t.featuredArtist)
        );
        return v.length > 0 ? v : profile.tracks;
      }
      case 'collabs': {
        const c = profile.tracks.filter(
          (t) =>
            t.trackType === 'collab' ||
            Boolean(t.featuredArtist) ||
            /(?:\bfeat\b|\bft\b|\bwith\b|&)/i.test(t.title)
        );
        return c.length > 0 ? c : profile.tracks;
      }
      case 'audio': {
        const a = profile.tracks.filter(
          (t) => t.trackType === 'audio' || (!t.featuredArtist && t.trackType !== 'video')
        );
        return a.length > 0 ? a : profile.tracks;
      }
      case 'all':
      default:
        return profile.tracks;
    }
  })();

  return (
    <div className="artist-cinematic-page">
      {/* 0. Full-Screen Authentic Loading Buffer Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="artist-loading-screen"
            className="artist-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.35 }}
          >
            {/* Ambient Radial Pulsing Glows */}
            <div className="artist-loading-glow-core" />
            <div className="artist-loading-glow-ambient" />

            {/* Top Bar for Navigation / Cancellation */}
            <div className="artist-loading-topbar">
              {onBackToPlayer ? (
                <button
                  type="button"
                  className="artist-return-btn"
                  onClick={onBackToPlayer}
                  title="Return to active player session"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Player</span>
                </button>
              ) : onBackToArtists ? (
                <button
                  type="button"
                  className="artist-return-btn"
                  onClick={onBackToArtists}
                  title="Return to Artists Discovery Hub"
                >
                  <ArrowLeft size={14} />
                  <span>Artists</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="artist-return-btn"
                  onClick={onBackToHome}
                  title="Return to Home"
                >
                  <ArrowLeft size={14} />
                  <span>Home</span>
                </button>
              )}
            </div>

            {/* Central Content */}
            <div className="artist-loading-center">
              {/* Animated Vinyl Sonic Core with Equalizer */}
              <div className="artist-loading-disc-stage">
                <div className="artist-loading-ring ring-1" />
                <div className="artist-loading-ring ring-2" />
                <div className="artist-loading-ring ring-3" />

                <div className="artist-loading-disc">
                  <div className="artist-loading-disc-grooves" />
                  <div className="artist-loading-disc-center">
                    <div className="artist-loading-eq-bars">
                      <span className="eq-bar bar-1" />
                      <span className="eq-bar bar-2" />
                      <span className="eq-bar bar-3" />
                      <span className="eq-bar bar-4" />
                      <span className="eq-bar bar-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Curation Badge */}
              <motion.div
                className="artist-loading-badge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <Sparkles size={13} className="text-accent" />
                <span>LYRIXER CURATION ENGINE</span>
              </motion.div>

              {/* Primary Authentic Title */}
              <motion.h2
                className="artist-loading-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.45 }}
              >
                Fetching the Artist's Details for you
              </motion.h2>

              {/* Dynamic Context Subtitle */}
              <motion.p
                className="artist-loading-subtitle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.45 }}
              >
                Curating master photography, verified discography & official videos for{' '}
                <strong className="artist-loading-highlight">{targetArtistName}</strong>
              </motion.p>

              {/* Glowing Progress Line */}
              <div className="artist-loading-bar-wrap">
                <div className="artist-loading-bar-shimmer" />
              </div>

              {/* Rotating Phased Status Step */}
              <div className="artist-loading-status-wrap">
                <span className="artist-loading-status-pulse" />
                <span className="artist-loading-status-text">
                  {LOADING_STEPS[loadingStep]}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Extended Full-Screen Backdrop: Upscaled Clear Quality Artist Image covering entire screen (100vw x 100vh) */}
      <div className="artist-bg-viewport" aria-hidden="true">
        <motion.img
          key={profile.heroImageUrl}
          src={profile.heroImageUrl}
          alt={profile.name}
          className="artist-bg-photo"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.includes('unsplash.com')) {
              target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=2560&q=95';
            }
          }}
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

            {onBackToArtists && (
              <button
                type="button"
                className="artist-return-btn primary"
                onClick={onBackToArtists}
                title="Return to Artists Discovery Hub"
              >
                <ArrowLeft size={14} />
                <span>Artists</span>
              </button>
            )}

            <button
              type="button"
              className="artist-return-btn"
              onClick={onBackToHome}
              title="Return to LyriXer Home"
            >
              {!onBackToPlayer && !onBackToArtists && <ArrowLeft size={14} />}
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
            All Songs ({profile.tracks.length})
          </button>
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveCategory('popular')}
          >
            Top Hits
          </button>
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('videos')}
          >
            Music Videos {videoCount > 0 ? `(${videoCount})` : ''}
          </button>
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'collabs' ? 'active' : ''}`}
            onClick={() => setActiveCategory('collabs')}
          >
            Collabs & Features {collabCount > 0 ? `(${collabCount})` : ''}
          </button>
          <button
            type="button"
            className={`cat-tab ${activeCategory === 'audio' ? 'active' : ''}`}
            onClick={() => setActiveCategory('audio')}
          >
            Album Audios {audioCount > 0 ? `(${audioCount})` : ''}
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
