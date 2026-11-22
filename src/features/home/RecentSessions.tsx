import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, FileVideo, Disc3 } from 'lucide-react';
import { YoutubeIcon } from '../../components/ui/Icons';
import type { RecentSession, VideoSource } from '../../types/session';
import { formatDuration, formatRelativeTime } from '../../utils/formatters';
import './RecentSessions.css';

export type VaultPlatformFilter = 'all' | 'youtube' | 'local';

interface RecentSessionsProps {
  sessions?: RecentSession[];
  onSelectSession?: (source: VideoSource) => void;
  onOpenArtist?: (artistName: string) => void;
}

function parseArtistTitle(session: RecentSession) {
  if (session.artist && session.artist !== 'YouTube Music' && session.artist !== 'Local Video') {
    return { artist: session.artist, title: session.title };
  }
  if (session.title.includes(' - ')) {
    const parts = session.title.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }
  return {
    artist: session.artist || (session.kind === 'youtube' ? 'YOUTUBE MUSIC' : 'LOCAL MEDIA'),
    title: session.title,
  };
}

export const RecentSessions: React.FC<RecentSessionsProps> = React.memo<RecentSessionsProps>(({
  sessions = [],
  onSelectSession,
  onOpenArtist,
}) => {
  const [platformFilter, setPlatformFilter] = useState<VaultPlatformFilter>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredSessions = useMemo(() => {
    if (platformFilter === 'all') return sessions;
    if (platformFilter === 'youtube') {
      return sessions.filter((s) => s.kind === 'youtube');
    }
    return sessions.filter((s) => s.kind === 'local');
  }, [sessions, platformFilter]);

  const primarySpotlight = filteredSessions[0];
  const featuredTrio = filteredSessions.slice(1, 4);
  const remainingSessions = filteredSessions.slice(4);

  const handleCardClick = (session: RecentSession) => {
    if (onSelectSession) {
      onSelectSession({
        kind: session.kind,
        sourceId: session.sourceId,
        title: session.title,
        thumbnailUrl: session.thumbnailUrl,
        duration: session.duration,
      });
    }
  };

  return (
    <section className="recent-section" aria-label="Studio Vault & Recent Sessions">
      <div className="recent-container">
        {/* Minimalist HUD Header (Matching 01 // TRENDING_SIGNALS) */}
        <div className="recent-hud-header">
          <div className="recent-header-left">
            <span className="recent-index-tag">[ 02 // STUDIO_VAULT_ARCHIVE ]</span>
            <span className="recent-status-text">
              SESSION_RECORDS // {filteredSessions.length} ARCHIVED
            </span>
          </div>

          {/* Platform Filter Links */}
          <div className="recent-filter-strip" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'all'}
              className={`filter-link ${platformFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('all')}
            >
              [ ALL_VAULT ]
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'youtube'}
              className={`filter-link ${platformFilter === 'youtube' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('youtube')}
            >
              [ YOUTUBE ]
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'local'}
              className={`filter-link ${platformFilter === 'local' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('local')}
            >
              [ LOCAL_MEDIA ]
            </button>
          </div>
        </div>

        {/* Content: Empty State vs Architectural Stage */}
        <AnimatePresence mode="wait">
          {filteredSessions.length === 0 ? (
            /* Cybernetic HUD Empty State */
            <motion.div
              key="vault-empty-state"
              className="recent-empty-state"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="empty-state-icon-wrap">
                <Disc3 size={24} className="empty-state-icon" />
              </div>
              <h3 className="empty-state-title">[ VAULT_ARCHIVE // EMPTY ]</h3>
              <p className="empty-state-text">
                No active session telemetry found in this vault cluster. Engage any YouTube music link
                or spin a curated record above to archive your playback session here.
              </p>
            </motion.div>
          ) : (
            /* Dynamic Architectural Stage (Panoramic Feature + Trio + Expandable Ledger) */
            <div className="recent-architectural-stage" key="vault-populated-stage">
              {/* 1. Panoramic Primary Feature Card (Most Recent Session) */}
              {primarySpotlight && (() => {
                const { artist, title } = parseArtistTitle(primarySpotlight);
                return (
                  <motion.div
                    key={primarySpotlight.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="recent-panoramic-card"
                    onClick={() => handleCardClick(primarySpotlight)}
                  >
                    <div className="panoramic-media-frame">
                      {primarySpotlight.thumbnailUrl ? (
                        <img
                          src={primarySpotlight.thumbnailUrl}
                          alt={title}
                          className="panoramic-thumb-img"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="panoramic-fallback-frame">
                          <FileVideo size={48} className="panoramic-fallback-icon" />
                        </div>
                      )}
                      <div className="panoramic-scrim" />
                    </div>

                    {/* HUD Notches & Telemetry */}
                    <div className="panoramic-hud-content">
                      <div className="panoramic-top-row">
                        <span className="panoramic-rank-tag">#01 // LAST_ACTIVE</span>
                        <span className="panoramic-stat-tag">
                          {primarySpotlight.duration ? formatDuration(primarySpotlight.duration) : 'VARIABLE_LEN'}
                        </span>
                      </div>

                      <div className="panoramic-center-title">
                        <h3 className="panoramic-track-title">{title.toUpperCase()}</h3>
                        <div className="panoramic-artist-line">
                          <span>{artist.toUpperCase()}</span>
                          {onOpenArtist && (
                            <button
                              type="button"
                              className="panoramic-artist-jump"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenArtist(artist);
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
                          <span>RESUME_SESSION</span>
                        </div>
                        <span className="panoramic-meta-chip">
                          {formatRelativeTime(primarySpotlight.playedAt).toUpperCase()} // {primarySpotlight.kind.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* 2. Minimalist Horizontal Divider Glyph */}
              {featuredTrio.length > 0 && (
                <div className="recent-mid-divider" aria-hidden="true">
                  <span className="divider-line" />
                  <span className="divider-glyph">&#8644; [ SESSION_HISTORY ]</span>
                  <span className="divider-line" />
                </div>
              )}

              {/* 3. Architectural Trio (Up to 3 Tall Cards) */}
              {featuredTrio.length > 0 && (
                <div className="recent-trio-grid">
                  {featuredTrio.map((session, i) => {
                    const { artist, title } = parseArtistTitle(session);
                    const rankNum = i + 2;
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="recent-tall-card"
                        onClick={() => handleCardClick(session)}
                      >
                        <div className="tall-media-frame">
                          {session.thumbnailUrl ? (
                            <img
                              src={session.thumbnailUrl}
                              alt={title}
                              className="tall-thumb-img"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="tall-fallback-frame">
                              <FileVideo size={32} />
                            </div>
                          )}
                          <div className="tall-scrim" />
                        </div>

                        <div className="tall-hud-content">
                          <div className="tall-top-row">
                            <span className="tall-rank-badge">#{rankNum < 10 ? `0${rankNum}` : rankNum}</span>
                            <span className="tall-views-tag">
                              {session.duration ? formatDuration(session.duration) : session.kind.toUpperCase()}
                            </span>
                          </div>

                          <div className="tall-center-title">
                            <h4 className="tall-title">{title.toUpperCase()}</h4>
                            <span className="tall-artist">{artist.toUpperCase()}</span>
                          </div>

                          <div className="tall-bottom-action">
                            <div className="tall-play-pill">
                              <Play size={10} fill="currentColor" />
                              <span>RESUME</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 4. Expandable Ledger (For Sessions #5+) */}
              {remainingSessions.length > 0 && (
                <div className="recent-expand-wrap">
                  <button
                    type="button"
                    className="recent-expand-btn"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll
                      ? '[ COLLAPSE_VAULT ]'
                      : `[ EXPAND_VAULT_ARCHIVE (+${remainingSessions.length}) ]`}
                  </button>

                  <AnimatePresence>
                    {showAll && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="recent-expanded-ledger"
                      >
                        {remainingSessions.map((session, idx) => {
                          const { artist, title } = parseArtistTitle(session);
                          const overallRank = idx + 5;
                          return (
                            <div
                              key={session.id}
                              className="expanded-track-row"
                              onClick={() => handleCardClick(session)}
                            >
                              <span className="exp-rank">
                                #{overallRank < 10 ? `0${overallRank}` : overallRank}
                              </span>
                              <span className="exp-title">{title}</span>
                              <span className="exp-artist">{artist}</span>
                              <span className="exp-source">
                                {session.kind === 'youtube' ? (
                                  <YoutubeIcon size={12} className="exp-icon" />
                                ) : (
                                  <FileVideo size={12} className="exp-icon" />
                                )}
                              </span>
                              <span className="exp-views">
                                {session.duration ? formatDuration(session.duration) : '--:--'}
                              </span>
                              <span className="exp-time">
                                {formatRelativeTime(session.playedAt)}
                              </span>
                              <Play size={12} className="exp-play-icon" />
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

RecentSessions.displayName = 'RecentSessions';
export default RecentSessions;
