import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Play,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-verify daily refresh status on mount
  useEffect(() => {
    const daily = TrendingFeedService.getDailyTrendingFeed();
    setFeedData(daily);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    const refreshed = TrendingFeedService.refreshDailyFeed();
    setFeedData({
      tracks: refreshed.tracks,
      lastUpdatedDateString: refreshed.lastUpdatedDateString,
      isFreshToday: true,
    });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const filteredTracks = useMemo(() => {
    const all = feedData.tracks;
    if (platformFilter === 'all') return all;
    if (platformFilter === 'instagram') {
      return all.filter((t) => t.platform === 'instagram' || t.platform === 'both');
    }
    return all.filter((t) => t.platform === 'youtube' || t.platform === 'both');
  }, [feedData.tracks, platformFilter]);

  const spotlightTrack = filteredTracks[0];
  const gridTracks = filteredTracks.slice(1);

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
    <section className="trending-section" aria-label="Trending on Instagram & YouTube">
      <div className="trending-container">
        {/* Section Top Header & Filters */}
        <div className="trending-header">
          <div className="trending-title-group">
            {/* Live 24H Radar Badge */}
            <div className="trending-radar-pill">
              <span className="radar-live-dot" />
              <Flame size={13} className="radar-fire-icon" />
              <span className="radar-title">DAILY 24-HOUR RADAR</span>
              <span className="radar-sep">&middot;</span>
              <span className="radar-date">Updated {feedData.lastUpdatedDateString}</span>
            </div>

            <h2 className="trending-heading">
              Trending on Instagram &amp; YouTube
            </h2>
            <p className="trending-subheading">
              Official music videos of current global viral tracks, high-velocity Reels anthems, and YouTube chart leaders.
              Select any song to enjoy synchronized 24-bit real-time lyrics.
            </p>
          </div>

          {/* Action Row: Platform Filter Tabs & Refresh Button */}
          <div className="trending-actions-bar">
            <div className="trending-filter-tabs" role="tablist" aria-label="Platform Filters">
              <button
                type="button"
                role="tab"
                aria-selected={platformFilter === 'all'}
                className={`trending-tab ${platformFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('all')}
              >
                <Sparkles size={13} />
                <span>All Viral ({feedData.tracks.length})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={platformFilter === 'instagram'}
                className={`trending-tab tab-instagram ${platformFilter === 'instagram' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('instagram')}
              >
                <span className="ig-color-dot" />
                <span>Instagram Reels</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={platformFilter === 'youtube'}
                className={`trending-tab tab-youtube ${platformFilter === 'youtube' ? 'active' : ''}`}
                onClick={() => setPlatformFilter('youtube')}
              >
                <span className="yt-color-dot" />
                <span>YouTube Trending</span>
              </button>
            </div>

            {/* Refresh Daily Feed Button */}
            <button
              type="button"
              className={`trending-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
              onClick={handleManualRefresh}
              title="Resync daily 24h trending charts"
              aria-label="Refresh trending charts"
            >
              <RotateCcw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Featured #1 Spotlight Hero Card */}
        {spotlightTrack && (
          <motion.div
            key={spotlightTrack.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="trending-spotlight-card"
          >
            <div className="spotlight-media-wrap">
              <img
                src={spotlightTrack.thumbnailUrl}
                alt={`${spotlightTrack.artist} - ${spotlightTrack.title} Official Music Video`}
                className="spotlight-thumb-img"
                loading="lazy"
              />
              <div className="spotlight-media-overlay" />
              <div className="spotlight-rank-badge">#01 SPOTLIGHT</div>
            </div>

            <div className="spotlight-info-col">
              <div className="spotlight-meta-top">
                <span className="spotlight-badge">{spotlightTrack.badge}</span>
                <span className="spotlight-platform-pill">
                  {spotlightTrack.platform === 'both' ? 'Instagram & YouTube Viral' : spotlightTrack.platform === 'instagram' ? 'Instagram Reels #1' : 'YouTube Top Hit'}
                </span>
                {spotlightTrack.dailyVelocity && (
                  <span className="spotlight-velocity-tag">
                    <TrendingUp size={11} />
                    <span>{spotlightTrack.dailyVelocity}</span>
                  </span>
                )}
              </div>

              <h3 className="spotlight-track-title">{spotlightTrack.title}</h3>

              <div className="spotlight-artist-row">
                <span className="spotlight-artist-name">{spotlightTrack.artist}</span>
                <CheckCircle2 size={13} className="verified-artist-icon" />
                {onOpenArtist && (
                  <button
                    type="button"
                    className="spotlight-view-artist-btn"
                    onClick={() => onOpenArtist(spotlightTrack.artist)}
                    title={`View ${spotlightTrack.artist} catalog`}
                  >
                    View Artist
                  </button>
                )}
              </div>

              <p className="spotlight-lyrics-quote">
                &ldquo;{spotlightTrack.lyricsSnippet}&rdquo;
              </p>

              <div className="spotlight-stats-row">
                <span className="spotlight-stat">{spotlightTrack.viewsCount}</span>
                <span className="spotlight-stat-sep">&middot;</span>
                <span className="spotlight-stat">{spotlightTrack.reelsCount}</span>
                <span className="spotlight-stat-sep">&middot;</span>
                <span className="spotlight-stat genre-tag">{spotlightTrack.genre}</span>
              </div>

              <div className="spotlight-actions">
                <button
                  type="button"
                  className="spotlight-play-btn"
                  onClick={() => handlePlayTrack(spotlightTrack)}
                  title={`Play official video for ${spotlightTrack.title}`}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Play Official Video</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid of Verified Official Music Videos */}
        <div className="trending-grid">
          <AnimatePresence mode="popLayout">
            {gridTracks.map((track) => (
              <motion.article
                key={track.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="trending-card"
                onClick={() => handlePlayTrack(track)}
              >
                {/* 16:9 Official Music Video Thumbnail */}
                <div className="card-thumb-wrap">
                  <img
                    src={track.thumbnailUrl}
                    alt={`${track.artist} - ${track.title}`}
                    className="card-thumb-img"
                    loading="lazy"
                  />
                  <div className="card-thumb-gradient" />

                  {/* Rank Badge */}
                  <span className="card-rank-tag">
                    #{track.rank < 10 ? `0${track.rank}` : track.rank}
                  </span>

                  {/* Platform Indicator */}
                  <span className={`card-platform-pill platform-${track.platform}`}>
                    {track.platform === 'instagram' ? 'Reels' : track.platform === 'youtube' ? 'YouTube' : 'Reels + YT'}
                  </span>

                  {/* Play Button Overlay on Hover */}
                  <div className="card-play-hover-btn" aria-hidden="true">
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>

                {/* Card Editorial Info */}
                <div className="card-body">
                  <div className="card-badge-row">
                    <span className="card-badge-pill">{track.badge}</span>
                    <span className="card-genre-pill">{track.genre}</span>
                  </div>

                  <h4 className="card-title" title={track.title}>
                    {track.title}
                  </h4>

                  <div className="card-artist-row">
                    <span className="card-artist" title={track.artist}>
                      {track.artist}
                    </span>
                    <CheckCircle2 size={12} className="card-verified-icon" />
                  </div>

                  <p className="card-quote">
                    &ldquo;{track.lyricsSnippet}&rdquo;
                  </p>

                  <div className="card-footer-stats">
                    <span className="card-stat-text">{track.viewsCount}</span>
                    <span className="card-stat-dot">&middot;</span>
                    <span className="card-stat-text">{track.reelsCount}</span>
                    {track.dailyVelocity && (
                      <span className="card-velocity-tag">{track.dailyVelocity}</span>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
});

TrendingTracksSection.displayName = 'TrendingTracksSection';
