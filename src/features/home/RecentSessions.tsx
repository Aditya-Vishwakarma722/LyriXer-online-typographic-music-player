import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, FileVideo, Disc3 } from 'lucide-react';
import { YoutubeIcon } from '../../components/ui/Icons';
import SpotlightCard from '../../components/reactbits/SpotlightCard';
import type { RecentSession, VideoSource } from '../../types/session';
import { formatDuration, formatRelativeTime } from '../../utils/formatters';
import './RecentSessions.css';

interface RecentSessionsProps {
  sessions?: RecentSession[];
  onSelectSession?: (source: VideoSource) => void;
}

export const RecentSessions: React.FC<RecentSessionsProps> = React.memo<RecentSessionsProps>(({
  sessions = [],
  onSelectSession,
}) => {
  const displaySessions = sessions;

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
        {/* Section Header */}
        <div className="recent-header">
          <div className="recent-header-left">
            <span className="recent-index-tag">[ 02 // STUDIO_VAULT_ARCHIVE ]</span>
            <span className="recent-status-text">CACHED_SESSIONS // {displaySessions.length} RECORDS</span>
          </div>
        </div>

        {/* Content: Empty State vs Cards */}
        <AnimatePresence mode="wait">
          {displaySessions.length === 0 ? (
            /* Quiet Minimal Empty State */
            <motion.div
              key="empty-state"
              className="recent-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="empty-state-icon-wrap">
                <Disc3 size={24} className="empty-state-icon" />
              </div>
              <h3 className="empty-state-title">Your Studio Vault is Empty</h3>
              <p className="empty-state-text">
                Paste any YouTube music video link or spin a curated record above to initiate your first synchronized lyrics session.
              </p>
            </motion.div>
          ) : (
            /* Populated Session Cards Grid */
            <motion.div
              key="populated-state"
              className="recent-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              {displaySessions.map((session) => (
                <SpotlightCard
                  key={session.id}
                  className="recent-card"
                  spotlightColor="rgba(0, 242, 254, 0.16)"
                  intensity={0.2}
                  spotlightSize={180}
                  borderGlow={0.5}
                  onClick={() => handleCardClick(session)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(session);
                    }
                  }}
                >
                  <div className="recent-card-thumbnail">
                    {session.thumbnailUrl ? (
                      <img
                        src={session.thumbnailUrl}
                        alt={session.title}
                        className="thumbnail-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="thumbnail-fallback">
                        <FileVideo size={20} />
                      </div>
                    )}
                    <div className="thumbnail-overlay">
                      <div className="play-pill">
                        <Play size={12} fill="currentColor" />
                        <span>Resume</span>
                      </div>
                    </div>
                  </div>

                  <div className="recent-card-content">
                    <h3 className="recent-card-title" title={session.title}>
                      {session.title}
                    </h3>

                    <div className="recent-card-meta">
                      <span className="source-tag">
                        {session.kind === 'youtube' ? (
                          <>
                            <YoutubeIcon size={12} className="meta-icon" /> YouTube
                          </>
                        ) : (
                          <>
                            <FileVideo size={12} className="meta-icon" /> Local
                          </>
                        )}
                      </span>
                      {session.duration && (
                        <>
                          <span className="meta-bullet">•</span>
                          <span>{formatDuration(session.duration)}</span>
                        </>
                      )}
                      <span className="meta-bullet">•</span>
                      <span>{formatRelativeTime(session.playedAt)}</span>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

RecentSessions.displayName = 'RecentSessions';
