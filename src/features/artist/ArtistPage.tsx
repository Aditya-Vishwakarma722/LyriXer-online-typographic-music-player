import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flame,
  Headphones,
  Radio,
  Play,
  Disc3,
  Layers,
  Terminal,
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
    'SCANNING_VERIFIED_DISCOGRAPHY...',
    'BUFFERING_MASTER_PHOTOGRAPHY...',
    'SYNCHRONIZING_AUDIO_STEMS...',
  ];

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 700);

    const startTime = Date.now();

    ArtistService.fetchArtistProfile(targetArtistName)
      .then((resolved) => {
        const elapsed = Date.now() - startTime;
        const minBufferMs = 500;
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
      ? '#1 TOP HIT'
      : currentActiveTrack?.isOfficial
      ? 'OFFICIAL VIDEO'
      : 'MASTER STEM',
    lyricsSnippet: currentActiveTrack?.album
      ? `ALBUM: ${currentActiveTrack.album.toUpperCase()}${currentActiveTrack.year ? ` [${currentActiveTrack.year}]` : ''}`
      : `VERIFIED ARCHIVE // ${profile.genre.toUpperCase()}`,
  };

  const tickerItems = [
    `SUBJECT: ${profile.name.toUpperCase()}`,
    `ARCHIVE_ID // 0x${profile.id.toUpperCase()}`,
    `${profile.genre.toUpperCase()} MASTER DISCOGRAPHY`,
    `${profile.tracks.length} VERIFIED MASTER RECORDINGS`,
    `LRCLIB REAL-TIME SYNCHRONIZED LYRICS`,
    `24-BIT / 96kHz LOSSLESS AUDIO ENGINE`,
  ];

  return (
    <div className="artist-page-root" role="region" aria-label={`Artist Profile: ${profile.name}`}>
      {/* 0. Authentic Cybernetic Minimalist Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="artist-loading-screen"
            className="artist-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.3 }}
          >
            <div className="loading-hud-chassis">
              <span className="hud-corner-bracket corner-tl" />
              <span className="hud-corner-bracket corner-tr" />
              <span className="hud-corner-bracket corner-bl" />
              <span className="hud-corner-bracket corner-br" />

              <div className="loading-hud-header">
                <Terminal size={14} className="loading-terminal-icon" />
                <span className="loading-hud-title">SYSTEM // ARCHIVE_DECODER</span>
                <span className="loading-live-dot" />
              </div>

              <div className="loading-hud-body">
                <h2 className="loading-artist-name">{targetArtistName.toUpperCase()}</h2>
                <div className="loading-telemetry-status">
                  <span className="telemetry-prompt">&gt;</span>
                  <span className="telemetry-text">{LOADING_STEPS[loadingStep]}</span>
                </div>

                <div className="loading-progress-chassis">
                  <div className="loading-progress-laser" />
                </div>
              </div>

              <div className="loading-hud-footer">
                <span>BUFFER: 100% READY</span>
                <span>NODE: 0x734-STATION</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Monochromatic Atmospheric Photo Backdrop */}
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.18 }}
          transition={{ duration: 1 }}
        />
        <div className="artist-gradient-left" />
        <div className="artist-gradient-bottom" />
      </div>

      {/* 2. Top HUD Navigation Bar */}
      <header className="artist-top-bar">
        <div className="artist-nav-left">
          <BrandLogo size="sm" onClick={onBackToHome} className="artist-header-brand" />

          {onBackToPlayer && (
            <button
              type="button"
              className="artist-hud-btn"
              onClick={onBackToPlayer}
              title="Return to active player session"
            >
              <ArrowLeft size={13} />
              <span>[ PLAYER ]</span>
            </button>
          )}

          {onBackToArtists && (
            <button
              type="button"
              className="artist-hud-btn"
              onClick={onBackToArtists}
              title="Return to Artists Discovery Hub"
            >
              <ArrowLeft size={13} />
              <span>[ ARTISTS_HUB ]</span>
            </button>
          )}

          <button
            type="button"
            className="artist-hud-btn"
            onClick={onBackToHome}
            title="Return to LyriXer Home"
          >
            {!onBackToPlayer && !onBackToArtists && <ArrowLeft size={13} />}
            <span>[ HOME ]</span>
          </button>
        </div>

        <div className="artist-hud-telemetry-tag">
          <span className="telemetry-pulse-dot" />
          <span>ARCHIVE // {profile.name.toUpperCase()}</span>
        </div>
      </header>

      {/* 3. Kinetic Ticker Ribbon */}
      <KineticTicker items={tickerItems} speed="normal" className="artist-kinetic-ribbon" />

      {/* 4. Main Architectural Stage */}
      <div className="artist-monumental-stage">
        {/* ============================================================== */}
        {/* SECTION A: Monumental Artist Monograph Header                  */}
        {/* ============================================================== */}
        <section className="artist-monograph-card" aria-label="Artist Dossier">
          <span className="hud-corner-bracket corner-tl" aria-hidden="true" />
          <span className="hud-corner-bracket corner-tr" aria-hidden="true" />
          <span className="hud-corner-bracket corner-bl" aria-hidden="true" />
          <span className="hud-corner-bracket corner-br" aria-hidden="true" />

          <div className="monograph-top-spec">
            <span>SYS_ID: 0x{profile.id.toUpperCase()}-VERIFIED</span>
            <span className="spec-dot">&middot;</span>
            <span>CATALOGUE: {profile.tracks.length} TRACKS</span>
            <span className="spec-dot">&middot;</span>
            <span className="spec-cyan">STATUS // ACTIVE_STREAM</span>
          </div>

          <div className="monograph-content-grid">
            {/* Visual Subject Card */}
            <div className="monograph-avatar-frame">
              <img
                src={profile.heroImageUrl}
                alt={profile.name}
                className="monograph-avatar-img"
                referrerPolicy="no-referrer"
              />
              <div className="avatar-hud-overlay">
                <span className="avatar-coord-tag">REC_01</span>
                {profile.verified && (
                  <span className="avatar-verified-badge" title="Official Verified Artist">
                    <CheckCircle2 size={12} />
                    <span>VERIFIED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Subject Data & Dossier */}
            <div className="monograph-info-pane">
              <div className="monograph-tag-row">
                <span className="monograph-genre-chip">GENRE // {profile.genre.toUpperCase()}</span>
                {profile.monthlyListeners && (
                  <span className="monograph-listeners-chip">
                    <Headphones size={12} />
                    <span>AUDIENCE // {profile.monthlyListeners.toUpperCase()}</span>
                  </span>
                )}
                <span className="monograph-audio-chip">24-BIT / 96kHz HI-RES</span>
              </div>

              <h1 className="monograph-artist-title">{profile.name}</h1>

              {profile.bio && <p className="monograph-bio-text">{profile.bio}</p>}

              {profile.youtubeChannelUrl && (
                <div className="monograph-action-row">
                  <a
                    href={profile.youtubeChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="monograph-channel-btn"
                  >
                    <span>[ EXPLORE OFFICIAL YOUTUBE ARCHIVE ]</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION B: Category Filter Tabs Navigation                     */}
        {/* ============================================================== */}
        <div className="artist-catalogue-controls">
          <div className="catalogue-category-tabs" role="tablist" aria-label="Catalogue Categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <Layers size={13} />
              <span>[ ALL_RELEASES // {profile.tracks.length} ]</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'popular'}
              className={`cat-tab ${activeCategory === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveCategory('popular')}
            >
              <Flame size={13} className="cat-flame-icon" />
              <span>[ TOP_HITS ]</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'videos'}
              className={`cat-tab ${activeCategory === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveCategory('videos')}
            >
              <span>[ MUSIC_VIDEOS {videoCount > 0 ? `// ${videoCount}` : ''} ]</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'collabs'}
              className={`cat-tab ${activeCategory === 'collabs' ? 'active' : ''}`}
              onClick={() => setActiveCategory('collabs')}
            >
              <span>[ COLLABORATIONS {collabCount > 0 ? `// ${collabCount}` : ''} ]</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'audio'}
              className={`cat-tab ${activeCategory === 'audio' ? 'active' : ''}`}
              onClick={() => setActiveCategory('audio')}
            >
              <Disc3 size={13} />
              <span>[ ALBUM_AUDIOS {audioCount > 0 ? `// ${audioCount}` : ''} ]</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION C: Discography Ledger & Acoustic Companion             */}
        {/* ============================================================== */}
        <div className="artist-workspace-layout">
          {/* Main Tracklist Ledger */}
          <section className="artist-ledger-column" aria-label="Discography Ledger">
            <div className="ledger-table-header">
              <span className="col-header col-index">// #</span>
              <span className="col-header col-title">// COMPOSITION & MASTER STEM</span>
              <span className="col-header col-metrics">// METRICS & DURATION</span>
            </div>

            {isLoading && profile.tracks.length === 0 ? (
              <div className="artist-loading-pane">
                <div className="loading-spinner" />
                <span>QUERYING VERIFIED TRACK CATALOGUE...</span>
              </div>
            ) : (
              <div className="artist-tracklist-ledger">
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
              <span className="footer-code-tag">// DATA_SOURCE</span>
              <span>{profile.imageAttribution || 'Official Discography Metadata Verified by LyriXer Engine'}</span>
            </footer>
          </section>

          {/* Acoustic Station Deck (Clean Companion) */}
          <aside className="artist-station-column" aria-label="Acoustic Station">
            {/* Turntable Deck */}
            <div className="artist-station-card">
              <span className="hud-corner-bracket corner-tl" aria-hidden="true" />
              <span className="hud-corner-bracket corner-tr" aria-hidden="true" />
              <span className="hud-corner-bracket corner-bl" aria-hidden="true" />
              <span className="hud-corner-bracket corner-br" aria-hidden="true" />

              <div className="station-card-header">
                <Radio size={13} className="station-icon" />
                <span className="station-title">ACOUSTIC // PRISM_STATION</span>
                <span className="station-live-dot" />
              </div>

              <div className="station-deck-wrapper">
                <AcousticPrismDeck
                  track={activePrismInfo}
                  isPlaying={true}
                  onPlay={() => {
                    if (currentActiveTrack) {
                      onSelectTrack(currentActiveTrack);
                    }
                  }}
                  size="sm"
                />
              </div>

              {/* Quick Telemetry Grid */}
              <div className="station-stats-grid">
                <div className="station-stat-item">
                  <span className="stat-label">// RELEASES</span>
                  <span className="stat-value">{profile.tracks.length}</span>
                </div>
                <div className="station-stat-item">
                  <span className="stat-label">// OFFICIAL_MV</span>
                  <span className="stat-value">{videoCount}</span>
                </div>
                <div className="station-stat-item">
                  <span className="stat-label">// FEATURES</span>
                  <span className="stat-value">{collabCount}</span>
                </div>
                <div className="station-stat-item">
                  <span className="stat-label">// ENGINE</span>
                  <span className="stat-value">24-BIT</span>
                </div>
              </div>

              {displayedTracks.length > 0 && (
                <button
                  type="button"
                  className="station-lead-play-btn"
                  onClick={() => onSelectTrack(displayedTracks[0])}
                  title={`Play lead track: ${displayedTracks[0].title}`}
                >
                  <Play size={12} fill="currentColor" />
                  <span>ENGAGE #1: {displayedTracks[0].title.toUpperCase()}</span>
                </button>
              )}
            </div>
          </aside>
        </div>
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
            <span>[ RETURN_TO_PLAYER ]</span>
            <Play size={12} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtistPage;
