import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Flame,
  Sparkles,
  Layers,
  Play,
  Disc3,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { ArtistTrackRow } from './ArtistTrackRow';
import { ArtistService, parseViewCount } from '../../services/artist/artistService';
import { BrandLogo } from '../../components/ui/BrandLogo';
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

type CatalogueCategory = 'all' | 'popular' | 'recent';

interface AlbumBackdropItem {
  id: string;
  title: string;
  album?: string;
  year?: string;
  imageUrl: string;
}

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
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const LOADING_STEPS = [
    'SCANNING_VERIFIED_DISCOGRAPHY...',
    'BUFFERING_MASTER_PHOTOGRAPHY...',
    'SYNCHRONIZING_AUDIO_STEMS...',
  ];

  // Subscribe to automated dynamic catalog updates
  useEffect(() => {
    const unsubscribe = ArtistService.subscribeArtistUpdates((updatedProfile, newCount) => {
      const match =
        updatedProfile.id === profile.id ||
        updatedProfile.name.toLowerCase() === profile.name.toLowerCase();
      if (match) {
        setProfile(updatedProfile);
        if (newCount > 0) {
          setSyncNotice(`${newCount} NEW SONG${newCount > 1 ? 'S' : ''} SYNCHRONIZED`);
          setTimeout(() => setSyncNotice(null), 6000);
        }
      }
    });
    return unsubscribe;
  }, [profile.id, profile.name]);

  // Initial load and periodic interval release check
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
        const minBufferMs = 400;
        const remaining = Math.max(0, minBufferMs - elapsed);
        setTimeout(() => {
          if (!isCancelled) {
            setProfile(resolved);
            if (resolved.tracks.length > 0) {
              setPreviewTrack(resolved.tracks[0]);
            }
            setIsLoading(false);

            // Run automated background release check to detect any newly dropped songs
            setIsCheckingUpdate(true);
            ArtistService.checkForNewReleases(targetArtistName, resolved)
              .then(({ updatedProfile, newCount }) => {
                if (!isCancelled) {
                  setIsCheckingUpdate(false);
                  if (newCount > 0) {
                    setProfile(updatedProfile);
                    setSyncNotice(`${newCount} NEW SONG${newCount > 1 ? 'S' : ''} SYNCHRONIZED`);
                    setTimeout(() => setSyncNotice(null), 6000);
                  }
                }
              })
              .catch(() => {
                if (!isCancelled) setIsCheckingUpdate(false);
              });
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

  const handleManualSync = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    try {
      const { updatedProfile, newCount } = await ArtistService.checkForNewReleases(
        profile.name,
        profile,
        true
      );
      if (newCount > 0) {
        setProfile(updatedProfile);
        setSyncNotice(`${newCount} NEW RELEASE${newCount > 1 ? 'S' : ''} DETECTED`);
      } else {
        setSyncNotice('CATALOGUE IS UP TO DATE');
      }
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Exactly 3 Filters: All releases, Top hits (most streamed on YouTube), Recently released
  const displayedTracks = useMemo(() => {
    if (activeCategory === 'popular') {
      // Sort strictly by YouTube view count / streams descending
      const sorted = [...profile.tracks].sort((a, b) => {
        const vB = parseViewCount(b.views);
        const vA = parseViewCount(a.views);
        if (vB !== vA) return vB - vA;
        return (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0);
      });
      return sorted.map((track, idx) => ({ ...track, rank: idx + 1 }));
    }

    if (activeCategory === 'recent') {
      // Sort by release year descending (newest songs at top)
      const sorted = [...profile.tracks].sort((a, b) => {
        const yearB = parseInt(b.year || '0', 10);
        const yearA = parseInt(a.year || '0', 10);
        if (yearB !== yearA) return yearB - yearA;
        return parseViewCount(b.views) - parseViewCount(a.views);
      });
      return sorted;
    }

    // 'all' releases
    return profile.tracks;
  }, [profile.tracks, activeCategory]);

  // Extract distinct album covers & track thumbnails for the cinematic background montage
  const albumBackdrops = useMemo(() => {
    const items: AlbumBackdropItem[] = [];
    const seenImages = new Set<string>();

    // 1. Curated album covers if provided
    if (profile.albumCovers) {
      for (let i = 0; i < profile.albumCovers.length; i++) {
        const url = profile.albumCovers[i];
        if (!seenImages.has(url)) {
          seenImages.add(url);
          items.push({
            id: `album-cover-${i}`,
            title: `Studio Album ${i + 1}`,
            imageUrl: url,
          });
        }
      }
    }

    // 2. Curated hero images if provided (e.g. XXXTentacion, etc.)
    if (profile.heroImages) {
      for (let i = 0; i < profile.heroImages.length; i++) {
        const url = profile.heroImages[i];
        if (!seenImages.has(url)) {
          seenImages.add(url);
          items.push({
            id: `hero-img-${i}`,
            title: `${profile.name} Visual Archive`,
            imageUrl: url,
          });
        }
      }
    }

    // 3. Unique albums from tracks with their cover artwork
    const albumMap = new Map<string, ArtistTrack>();
    for (const t of profile.tracks) {
      if (t.album && !albumMap.has(t.album) && t.thumbnailUrl && !seenImages.has(t.thumbnailUrl)) {
        albumMap.set(t.album, t);
        seenImages.add(t.thumbnailUrl);
        items.push({
          id: t.videoId || t.id,
          title: t.title,
          album: t.album,
          year: t.year,
          imageUrl: t.thumbnailUrl,
        });
      }
    }

    // 4. Fill with top track covers to form a rich discography wall
    for (const t of profile.tracks) {
      if (items.length >= 12) break;
      if (t.thumbnailUrl && !seenImages.has(t.thumbnailUrl)) {
        seenImages.add(t.thumbnailUrl);
        items.push({
          id: t.videoId || t.id,
          title: t.title,
          album: t.album,
          year: t.year,
          imageUrl: t.thumbnailUrl,
        });
      }
    }

    return items;
  }, [profile.tracks, profile.albumCovers, profile.heroImages, profile.name]);

  // Discography eras for the clean floating companion
  const discographyEras = useMemo(() => {
    const map = new Map<string, { name: string; year: string; count: number }>();
    for (const t of profile.tracks) {
      if (t.album) {
        const existing = map.get(t.album);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(t.album, {
            name: t.album,
            year: t.year || 'Archive',
            count: 1,
          });
        }
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0)
    );
  }, [profile.tracks]);

  const tickerItems = [
    `SUBJECT: ${profile.name.toUpperCase()}`,
    `ARCHIVE_ID // 0x${profile.id.toUpperCase()}`,
    `${profile.genre.toUpperCase()} MASTER DISCOGRAPHY`,
    `${profile.tracks.length} VERIFIED RECORDINGS`,
    `LRCLIB REAL-TIME SYNCHRONIZED LYRICS`,
    `AUTO_SYNC ACTIVE (6H INTERVAL)`,
  ];

  return (
    <div className="artist-page-root" role="region" aria-label={`Artist Profile: ${profile.name}`}>
      {/* 0. Cybernetic Minimalist Terminal Loading Buffer */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="artist-loading-screen"
            className="artist-loading-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
            transition={{ duration: 0.25 }}
          >
            <div className="loading-hud-chassis">
              <div className="loading-hud-header">
                <Terminal size={13} className="loading-terminal-icon" />
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

      {/* ============================================================== */}
      {/* 1. Full-Screen Cinematic Backdrop (Album Covers & Master Art)   */}
      {/* ============================================================== */}
      <div className="artist-bg-viewport" aria-hidden="true">
        {/* Full-bleed Artist Master Photography */}
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
          animate={{ opacity: 0.32 }}
          transition={{ duration: 0.9 }}
        />

        {/* Discography Album Covers Backdrop Montage (Right & Center Stage) */}
        <div className="artist-album-wall-backdrop">
          {albumBackdrops.map((item, idx) => {
            const isSpotlighted =
              previewTrack?.album === item.album ||
              previewTrack?.thumbnailUrl === item.imageUrl ||
              previewTrack?.videoId === item.id;
            return (
              <div
                key={item.id || idx}
                className={`artist-album-tile ${isSpotlighted ? 'is-spotlighted' : ''}`}
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title || item.album}
                  className="artist-album-tile-img"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="artist-album-tile-overlay">
                  <span className="tile-year">{item.year || 'ERA'}</span>
                  <span className="tile-name">{item.album || item.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Atmospheric Gradients: Dark Obsidian on Left (100% song readability) + Fade to Bottom */}
        <div className="artist-gradient-left" />
        <div className="artist-gradient-bottom" />
        <div className="artist-vignette-overlay" />
      </div>

      {/* 2. Top Minimal HUD Navigation Bar */}
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

        <div className="artist-top-right-group">
          {syncNotice && (
            <div className="artist-sync-toast" role="status">
              <span className="sync-pulse-dot" />
              <span>{syncNotice}</span>
            </div>
          )}

          <button
            type="button"
            className="artist-sync-btn"
            onClick={handleManualSync}
            title="Check for new official releases on YouTube"
          >
            <RefreshCw size={11} className={isCheckingUpdate ? 'animate-spin' : ''} />
            <span>{isCheckingUpdate ? 'SYNCING...' : 'SYNC_CATALOGUE'}</span>
          </button>

          <div className="artist-hud-telemetry-tag">
            <span className="telemetry-pulse-dot" />
            <span>ARCHIVE // {profile.name.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* 3. Kinetic Ticker Ribbon */}
      <KineticTicker items={tickerItems} speed="normal" className="artist-kinetic-ribbon" />

      {/* ============================================================== */}
      {/* 4. Left-Side Focused Stage (Songs on Left, Album Covers Behind) */}
      {/* ============================================================== */}
      <div className="artist-main-layout">
        {/* Left Stage: Artist Dossier, Filter Tabs, and Discography Ledger */}
        <div className="artist-stage-left">
          {/* SECTION A: Monumental Artist Dossier Monograph Header */}
          <section className="artist-dossier-hero" aria-label="Artist Dossier">
            <div className="dossier-content-grid">
              {/* Visual Avatar Frame */}
              <div className="dossier-avatar-frame">
                <img
                  src={profile.heroImageUrl}
                  alt={profile.name}
                  className="dossier-avatar-img"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <span className="dossier-coord-chip">REC_01 // VERIFIED</span>
              </div>

              {/* Subject Data & Dossier */}
              <div className="dossier-info-pane">
                <div className="dossier-meta-lead">
                  <span>SUBJECT // 0x{profile.id.toUpperCase()}</span>
                  <span className="meta-sep">&middot;</span>
                  <span className="meta-genre">GENRE // {profile.genre.toUpperCase()}</span>
                  {profile.verified && (
                    <>
                      <span className="meta-sep">&middot;</span>
                      <span className="meta-verified">
                        <CheckCircle2 size={11} />
                        VERIFIED
                      </span>
                    </>
                  )}
                </div>

                <h1 className="dossier-artist-title">{profile.name}</h1>

                <div className="dossier-telemetry-strip">
                  {profile.monthlyListeners && (
                    <span className="telemetry-chip">[ AUDIENCE // {profile.monthlyListeners.toUpperCase()} ]</span>
                  )}
                  <span className="telemetry-chip">[ {profile.tracks.length} MASTER_TRACKS ]</span>
                  <span className="telemetry-chip">[ 24-BIT / 96kHz HI-RES ]</span>
                  <span className="telemetry-chip cyan">[ AUTO_SYNC: 6H INTERVAL ]</span>
                </div>

                {profile.bio && <p className="dossier-bio-text">{profile.bio}</p>}

                {profile.youtubeChannelUrl && (
                  <div className="dossier-action-row">
                    <a
                      href={profile.youtubeChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dossier-channel-btn"
                    >
                      <span>[ EXPLORE OFFICIAL YOUTUBE ARCHIVE ]</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ============================================================== */}
          {/* SECTION B: Three Filter Tabs (All Releases, Top Hits, Recent)  */}
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
                <Layers size={12} />
                <span>[ ALL_RELEASES // {profile.tracks.length} ]</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'popular'}
                className={`cat-tab ${activeCategory === 'popular' ? 'active' : ''}`}
                onClick={() => setActiveCategory('popular')}
              >
                <Flame size={12} className="cat-flame-icon" />
                <span>[ TOP_HITS ]</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === 'recent'}
                className={`cat-tab ${activeCategory === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveCategory('recent')}
              >
                <Sparkles size={12} className="cat-sparkles-icon" />
                <span>[ RECENTLY_RELEASED ]</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION C: Discography Ledger Tracklist                        */}
          {/* ============================================================== */}
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
              <span className="footer-code-tag">// DATA_SOURCE:</span>
              <span>{profile.imageAttribution || 'Official Discography Metadata Verified by LyriXer Engine'}</span>
              <span className="footer-sync-tag">&middot; CATALOGUE_SYNC: ACTIVE</span>
            </footer>
          </section>
        </div>

        {/* ============================================================== */}
        {/* Right Stage: Floating Archival Studio Eras & Active Stem Pill  */}
        {/* ============================================================== */}
        <aside className="artist-stage-right" aria-label="Discography Eras">
          {/* Sleek Floating Archival Studio Eras Showcase */}
          <div className="artist-floating-eras-card">
            <div className="floating-card-header">
              <Disc3 size={13} className="floating-card-icon" />
              <span className="floating-card-title">DISCOGRAPHY // STUDIO_ERAS</span>
              <span className="floating-card-dot" />
            </div>

            <div className="floating-eras-list">
              {discographyEras.map((era) => {
                const isSelectedEra = previewTrack?.album === era.name;
                return (
                  <div
                    key={era.name}
                    className={`floating-era-item ${isSelectedEra ? 'is-selected-era' : ''}`}
                  >
                    <div className="era-lead">
                      <span className="era-year">[{era.year}]</span>
                      <span className="era-title">{era.name.toUpperCase()}</span>
                    </div>
                    <span className="era-count">{era.count} TRACKS</span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Active/Hovered Stem Highlight */}
            {previewTrack && (
              <div className="floating-active-stem">
                <div className="stem-tag-row">
                  <span className="stem-badge">ACTIVE STEM</span>
                  <span className="stem-time">{previewTrack.durationFormatted}</span>
                </div>
                <h4 className="stem-title">{previewTrack.title}</h4>
                <p className="stem-meta">
                  {previewTrack.album ? `ALBUM: ${previewTrack.album.toUpperCase()}` : 'OFFICIAL RELEASE'}
                  {previewTrack.views ? ` · ${previewTrack.views}` : ''}
                </p>
                <button
                  type="button"
                  className="stem-engage-btn"
                  onClick={() => onSelectTrack(previewTrack)}
                  title={`Engage playback for ${previewTrack.title}`}
                >
                  <Play size={11} fill="currentColor" />
                  <span>ENGAGE TRACK</span>
                </button>
              </div>
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
            <span>[ RETURN_TO_PLAYER ]</span>
            <Play size={12} fill="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtistPage;
