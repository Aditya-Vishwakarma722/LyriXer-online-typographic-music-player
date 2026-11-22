import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  TrendingFeedService,
  type TrendingTrackItem,
} from '../../services/trending/trendingFeedService';
import type { VideoSource } from '../../types/session';
import './TrendingTracksSection.css';

export type TrendingPlatformFilter = 'all' | 'instagram' | 'youtube';

interface TrendingTracksSectionProps {
  onStartSession: (source: VideoSource) => void;
  onOpenArtist?: (artistName: string) => void;
}

export const TrendingTracksSection: React.FC<TrendingTracksSectionProps> = React.memo<TrendingTracksSectionProps>(({
  onStartSession,
  onOpenArtist,
}) => {
  const [platformFilter, setPlatformFilter] = useState<TrendingPlatformFilter>('all');
  const [feedData, setFeedData] = useState(() => TrendingFeedService.getDailyTrendingFeed());
  const [showAll, setShowAll] = useState(false);
  const [isCycling, setIsCycling] = useState(false);

  useEffect(() => {
    const daily = TrendingFeedService.getDailyTrendingFeed();
    setFeedData(daily);
  }, []);

  const handleCycleRadar = () => {
    setIsCycling(true);
    const next = TrendingFeedService.cycleRadarNext(feedData.cycleOffset ?? 0);
    setFeedData({
      tracks: next.tracks,
      lastUpdatedDateString: next.lastUpdatedDateString,
      isFreshToday: true,
      cycleOffset: next.cycleOffset,
    });
    setTimeout(() => setIsCycling(false), 450);
  };

  const filteredTracks = useMemo(() => {
    const all = feedData.tracks;
    if (platformFilter === 'all') return all;
    if (platformFilter === 'instagram') {
      return all.filter((t) => t.platform === 'instagram' || t.platform === 'both');
    }
    return all.filter((t) => t.platform === 'youtube' || t.platform === 'both');
  }, [feedData.tracks, platformFilter]);

  const primarySpotlight = filteredTracks[0];
  const featuredTrio = filteredTracks.slice(1, 4);
  const remainingTracks = filteredTracks.slice(4);

  const handlePlayTrack = (track: TrendingTrackItem) => {
    onStartSession({
      kind: 'youtube',
      sourceId: track.videoId,
      title: `${track.artist} - ${track.title}`,
      artist: track.artist,
      duration: track.duration,
      thumbnailUrl: track.thumbnailUrl,
    });
  };

  return (
    <section className="trending-section" aria-label="Trending Signals">
      <div className="trending-container">
        {/* Minimalist HUD Header */}
        <div className="trending-hud-header">
          <div className="trending-header-left">
            <span className="trending-index-tag">[ 01 // TRENDING_SIGNALS ]</span>
            <span className="trending-status-text">RADAR_24H // {feedData.lastUpdatedDateString}</span>
            <button
              type="button"
              className="trending-cycle-btn"
              onClick={handleCycleRadar}
              title="Cycle fresh trending radar signals"
              aria-label="Cycle fresh trending radar signals"
            >
              <RefreshCw size={11} className={`cycle-icon ${isCycling ? 'spin' : ''}`} />
              <span>CYCLE_RADAR</span>
            </button>
          </div>

          {/* Minimal Platform Filter Links */}
          <div className="trending-filter-strip" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'all'}
              className={`filter-link ${platformFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('all')}
            >
              [ ALL_SIGNALS ]
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'instagram'}
              className={`filter-link ${platformFilter === 'instagram' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('instagram')}
            >
              [ REELS ]
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'youtube'}
              className={`filter-link ${platformFilter === 'youtube' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('youtube')}
            >
              [ SHORTS ]
            </button>
          </div>
        </div>

        {/* Dynamic Architectural Stage (Inspired by Hybrid Human ref_18) */}
        <div className="trending-architectural-stage">
          {/* 1. Panoramic Primary Feature Card */}
          {primarySpotlight && (
            <motion.div
              key={primarySpotlight.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="trending-panoramic-card"
              onClick={() => handlePlayTrack(primarySpotlight)}
            >
              <div className="panoramic-media-frame">
                <img
                  src={primarySpotlight.thumbnailUrl}
                  alt={primarySpotlight.title}
                  className="panoramic-thumb-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="panoramic-scrim" />
              </div>

              {/* HUD Notches & Telemetry */}
              <div className="panoramic-hud-content">
                <div className="panoramic-top-row">
                  <span className="panoramic-rank-tag">#01 // SPOTLIGHT</span>
                  <span className="panoramic-stat-tag">{primarySpotlight.viewsCount}</span>
                </div>

                <div className="panoramic-center-title">
                  <h3 className="panoramic-track-title">{primarySpotlight.title.toUpperCase()}</h3>
                  <div className="panoramic-artist-line">
                    <span>{primarySpotlight.artist.toUpperCase()}</span>
                    {onOpenArtist && (
                      <button
                        type="button"
                        className="panoramic-artist-jump"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenArtist(primarySpotlight.artist);
                        }}
                      >
                        [ VIEW_ARTIST ]
                      </button>
                    )}
                  </div>
                </div>

                <div className="panoramic-bottom-row">
                  <div className="panoramic-play-indicator">
                    <Play size={12} fill="currentColor" />
                    <span>ENGAGE_PLAYBACK</span>
                  </div>
                  <span className="panoramic-meta-chip">{primarySpotlight.badge}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. Minimalist Horizontal Divider Glyph */}
          <div className="trending-mid-divider" aria-hidden="true">
            <span className="divider-line" />
            <span className="divider-glyph">&#8644; [ VELOCITY_STREAM ]</span>
            <span className="divider-line" />
          </div>

          {/* 3. Dynamic Architectural Trio (3 Tall Cards) */}
          <div className="trending-trio-grid">
            {featuredTrio.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="trending-tall-card"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="tall-media-frame">
                  <img
                    src={track.thumbnailUrl}
                    alt={track.title}
                    className="tall-thumb-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="tall-scrim" />
                </div>

                <div className="tall-hud-content">
                  <div className="tall-top-row">
                    <span className="tall-rank-badge">#{track.rank < 10 ? `0${track.rank}` : track.rank}</span>
                    <span className="tall-views-tag">{track.viewsCount}</span>
                  </div>

                  <div className="tall-center-title">
                    <h4 className="tall-title">{track.title.toUpperCase()}</h4>
                    <span className="tall-artist">{track.artist.toUpperCase()}</span>
                  </div>

                  <div className="tall-bottom-action">
                    <div className="tall-play-pill">
                      <Play size={10} fill="currentColor" />
                      <span>PLAY</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 4. Optional Minimal Expandable Ledger */}
          {remainingTracks.length > 0 && (
            <div className="trending-expand-wrap">
              <button
                type="button"
                className="trending-expand-btn"
                onClick={() => setShowAll((prev) => !prev)}
              >
                <span>{showAll ? '[ - COLLAPSE SIGNALS ]' : `[ + EXPAND ALL ${filteredTracks.length} SIGNALS ]`}</span>
              </button>

              <AnimatePresence>
                {showAll && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="trending-expanded-ledger"
                  >
                    {remainingTracks.map((track) => (
                      <div
                        key={track.id}
                        className="expanded-track-row"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <span className="exp-rank">#{track.rank < 10 ? `0${track.rank}` : track.rank}</span>
                        <span className="exp-title">{track.title}</span>
                        <span className="exp-artist">{track.artist}</span>
                        <span className="exp-views">{track.viewsCount}</span>
                        <Play size={11} className="exp-play-icon" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

TrendingTracksSection.displayName = 'TrendingTracksSection';
export default TrendingTracksSection;
