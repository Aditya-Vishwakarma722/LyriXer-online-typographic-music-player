import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Music2, Play, FileVideo, Sparkles } from 'lucide-react';
import { YoutubeIcon } from '../../components/ui/Icons';
import type { RecentSession, VideoSource } from '../../types/session';
import { formatDuration, formatRelativeTime } from '../../utils/formatters';
import './RecentSessions.css';

interface RecentSessionsProps {
  onSelectSession?: (source: VideoSource) => void;
}

// Isolated mock sessions for testing & previewing the populated state
const MOCK_RECENT_SESSIONS: RecentSession[] = [
  {
    id: 'mock-1',
    title: 'Coldplay — Yellow',
    artist: 'Coldplay',
    thumbnailUrl: 'https://img.youtube.com/vi/yKNxeF4KMsY/hqdefault.jpg',
    kind: 'youtube',
    sourceId: 'yKNxeF4KMsY',
    duration: 269,
    playedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Queen — Bohemian Rhapsody (Remastered)',
    artist: 'Queen',
    thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    kind: 'youtube',
    sourceId: 'fJ9rUzIMcZQ',
    duration: 359,
    playedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Daft Punk — Get Lucky (Official Audio)',
    artist: 'Daft Punk ft. Pharrell Williams',
    thumbnailUrl: 'https://img.youtube.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    kind: 'youtube',
    sourceId: '5NV6Rdv1a3I',
    duration: 248,
    playedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export const RecentSessions: React.FC<RecentSessionsProps> = ({ onSelectSession }) => {
  const [showMockHistory, setShowMockHistory] = useState(false);
  const [sessions, setSessions] = useState<RecentSession[]>([]);

  const handleToggleMock = () => {
    if (showMockHistory) {
      setSessions([]);
      setShowMockHistory(false);
    } else {
      setSessions(MOCK_RECENT_SESSIONS);
      setShowMockHistory(true);
    }
  };

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
    <section className="recent-section" aria-label="Recently Played Sessions">
      <div className="recent-container">
        {/* Section Header */}
        <div className="recent-header">
          <div className="recent-title-group">
            <Clock size={15} className="recent-header-icon" />
            <h2 className="recent-heading">Recently Played</h2>
          </div>

          {/* Toggle for reviewing populated state */}
          <button
            type="button"
            className="mock-toggle-btn"
            onClick={handleToggleMock}
            title={showMockHistory ? 'Show clean empty state' : 'Preview sample sessions'}
          >
            <Sparkles size={12} />
            <span>{showMockHistory ? 'Reset to Empty' : 'Preview Demo History'}</span>
          </button>
        </div>

        {/* Content: Empty State vs Cards */}
        <AnimatePresence mode="wait">
          {sessions.length === 0 ? (
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
                <Music2 size={18} className="empty-state-icon" />
              </div>
              <p className="empty-state-text">
                No recent sessions yet. Start playing a track or select a video to begin.
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
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="recent-card"
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
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
