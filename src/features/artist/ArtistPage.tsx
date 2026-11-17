import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Play,
  Flame,
  Headphones,
  Radio,
} from 'lucide-react';
import { ArtistTrackRow } from './ArtistTrackRow';
import { ArtistService } from '../../services/artist/artistService';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { AcousticPrismDeck, type PrismTrackInfo } from '../../components/AcousticPrismDeck';
import { KineticTicker } from '../../components/KineticTicker';
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
  const [previewTrack, setPreviewTrack] = useState<ArtistTrack | null>(null);
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

    ArtistService.fetchArtistProfile(targetArtistName)
      .then((resolved) => {
        const elapsed = Date.now() - startTime;
        const minBufferMs = 650;
        const remaining = Math.max(0, minBufferMs - elapsed);
        setTimeout(() => {
          if (!isCancelled) {
            setProfile(resolved);
            if (resolved.tracks.length > 0) {
              setPreviewTrack(resolved.tracks[0]);
            }
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
      (t.title && (t.title.toLowerCase().includes('feat') || t.title.toLowerCase().includes('ft.')))
  ).length;

  const audioCount = profile.tracks.filter((t) => t.trackType === 'audio').length;

  // Filtered tracks
  const displayedTracks = profile.tracks.filter((t) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'popular') return Boolean(t.rank && t.rank <= 10);
    if (activeCategory === 'videos')
      return t.trackType === 'video' || (!t.trackType && t.isOfficial && !t.featuredArtist);
    if (activeCategory === 'collabs')
      return (
        t.trackType === 'collab' ||
        Boolean(t.featuredArtist) ||
        (t.title && (t.title.toLowerCase().includes('feat') || t.title.toLowerCase().includes('ft.')))
      );
    if (activeCategory === 'audio') return t.trackType === 'audio';
    return true;
  });

  const currentActiveTrack = previewTrack || displayedTracks[0] || profile.tracks[0] || null;

  const activePrismInfo: PrismTrackInfo = {
    title: currentActiveTrack?.title || profile.name,
    artist: profile.name,
    artworkUrl: currentActiveTrack?.thumbnailUrl || profile.heroImageUrl,
    duration: currentActiveTrack?.durationFormatted || currentActiveTrack?.duration,
    badge: Boolean(currentActiveTrack?.rank && currentActiveTrack.rank <= 10)
      ? '★ BILLBOARD TOP HIT'
      : currentActiveTrack?.isOfficial
      ? 'OFFICIAL MUSIC VIDEO'
      : 'MASTER STUDIO STEM',
    lyricsSnippet: currentActiveTrack?.album
      ? `Album: ${currentActiveTrack.album}${currentActiveTrack.year ? ` (${currentActiveTrack.year})` : ''}`
      : `Verified Discography Production &bull; ${profile.genre}`,
  };

  const tickerItems = [
    `VERIFIED ARTIST: ${profile.name.toUpperCase()}`,
    `${profile.genre.toUpperCase()} DISCOGRAPHY ARCHIVE`,
    `${profile.tracks.length}+ VERIFIED MASTER TRACKS`,
    `REAL-TIME SYNCHRONIZED LRCLIB LYRICS`,
    `HIGH-DEFINITION MASTER PHOTOGRAPHY`,
    `SPATIAL ACOUSTIC PLAYBACK`,
  ];

  return (
    <div className="artist-page-root" role="region" aria-label={`Artist Profile: ${profile.name}`}>
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
            <div className="artist-loading-glow-core" />
            <div className="artist-loading-glow-ambient" />

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

            <div className="artist-loading-center">
              <div className="artist-loading-disc-stage">
                <div className="artist-loading-ring ring-1" />
                <div className="artist-loading-ring ring-2" />
                <div className="artist-loading-ring ring-3" />

                <div className="artist-loading-prism-core">
                  <div className="artist-loading-eq-bars">
                    <span className="eq-bar bar-1" />
                    <span className="eq-bar bar-2" />
                    <span className="eq-bar bar-3" />
                    <span className="eq-bar bar-4" />
                    <span className="eq-bar bar-5" />
                  </div>
                </div>
              </div>

              <motion.div
                className="artist-loading-badge"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                <Sparkles size={13} className="text-accent" />
                <span>LYRIXER CURATION ENGINE</span>
              </motion.div>

              <motion.h2
                className="artist-loading-title"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.45 }}
              >
                Fetching the Artist's Details for you
              </motion.h2>

              <motion.p
                className="artist-loading-subtitle"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.45 }}
              >
                Curating master photography, verified discography & official videos for{' '}
                <strong className="artist-loading-highlight">{targetArtistName}</strong>
              </motion.p>

              <div className="artist-loading-bar-wrap">
                <div className="artist-loading-bar-shimmer" />
              </div>

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

      {/* 1. Extended Full-Screen Atmospheric Master Photo Backdrop */}
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
              target.src =
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=2560&q=95';
            }
          }}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <div className="artist-gradient-left" />
        <div className="artist-gradient-bottom" />
        <div className="artist-vignette-overlay" />
      </div>

      {/* 2. Top Navigation Bar */}
      <header className="artist-top-bar">
        <div className="artist-nav-left">
          <BrandLogo size="sm" onClick={onBackToHome} className="artist-header-brand" />

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

        <div className="artist-focus-badge">
          <Sparkles size={12} className="text-accent" />
          <span>OFFICIAL ARTIST MONOGRAPH</span>
        </div>
      </header>

      {/* 3. Kinetic Ticker Ribbon */}
      <KineticTicker items={tickerItems} speed="normal" className="artist-kinetic-ribbon" />

      {/* 4. Asymmetric Dual-Wing Editorial Stage (Same Architecture as Homepage) */}
      <div className="artist-dual-wing-stage">
        {/* ============================================================== */}
        {/* WING A (Left): Artist Identity, Bio, Categories & Tracklist     */}
        {/* ============================================================== */}
        <div className="artist-wing-editorial">
          {/* Identity Header */}
          <section className="artist-info-header">
            <div className="artist-identity-row">
              <div className="artist-avatar-crest">
                <img
                  src={profile.heroImageUrl}
                  alt={profile.name}
                  className="artist-crest-photo"
                  referrerPolicy="no-referrer"
                />
                <div className="artist-crest-ring" />
                {profile.verified && (
                  <div className="artist-crest-check" title="Official Verified Artist">
                    <CheckCircle2 size={11} />
                  </div>
                )}
              </div>

              <div className="artist-identity-meta">
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
                    <Headphones size={11} />
                    <span>{profile.monthlyListeners}</span>
                  </div>
                )}
              </div>
            </div>

            {profile.bio && <p className="artist-description-text">{profile.bio}</p>}

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

          {/* Catalogue Category Tabs */}
          <div className="catalogue-category-tabs">
            <button
              type="button"
              className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Releases ({profile.tracks.length})
            </button>
            <button
              type="button"
              className={`cat-tab ${activeCategory === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveCategory('popular')}
            >
              <Flame size={12} className="cat-flame-icon" />
              <span>Top Hits</span>
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

          {/* Master Tracklist Ledger */}
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
                      onHoverTrack={(t) => setPreviewTrack(t)}
                      isTopHitsTab={activeCategory === 'popular'}
                    />
                  );
                })}
              </div>
            )}

            <footer className="artist-footer-meta">
              <Sparkles size={12} className="text-accent" />
              <span>{profile.imageAttribution}</span>
            </footer>
          </section>
        </div>

        {/* ============================================================== */}
        {/* WING B (Right): Acoustic Prism Deck & Live Sonic Spotlight      */}
        {/* ============================================================== */}
        <aside className="artist-wing-turntable" aria-label="Acoustic Spatial Audio Stage">
          {/* Spatial Audio Prism Deck */}
          <div className="artist-turntable-card">
            <AcousticPrismDeck
              track={activePrismInfo}
              isPlaying={true}
              onPlay={() => {
                if (currentActiveTrack) {
                  onSelectTrack(currentActiveTrack);
                }
              }}
              size="md"
            />
          </div>

          {/* Discography Master Intelligence Card */}
          <div className="artist-spotlight-card">
            <div className="spotlight-header">
              <div className="spotlight-title-row">
                <Radio size={13} className="text-accent" />
                <span className="spotlight-title">STUDIO ARCHIVE OVERVIEW</span>
              </div>
              <span className="spotlight-status-dot" />
            </div>

            <div className="spotlight-stats-grid">
              <div className="spotlight-stat-item">
                <span className="stat-label">Total Releases</span>
                <span className="stat-value">{profile.tracks.length} Tracks</span>
              </div>
              <div className="spotlight-stat-item">
                <span className="stat-label">Music Videos</span>
                <span className="stat-value">{videoCount} Official</span>
              </div>
              <div className="spotlight-stat-item">
                <span className="stat-label">Collaborations</span>
                <span className="stat-value">{collabCount} Features</span>
              </div>
              <div className="spotlight-stat-item">
                <span className="stat-label">Audio Quality</span>
                <span className="stat-value">24-Bit / 96kHz</span>
              </div>
            </div>

            {displayedTracks.length > 0 && (
              <button
                type="button"
                className="spotlight-play-lead-btn"
                onClick={() => onSelectTrack(displayedTracks[0])}
                title={`Play ${displayedTracks[0].title}`}
              >
                <Play size={14} fill="currentColor" />
                <span>Play #{1} Track: {displayedTracks[0].title}</span>
              </button>
            )}
          </div>
        </aside>
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
