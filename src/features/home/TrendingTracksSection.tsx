import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Play,
  Sparkles,
  Video,
  Activity,
  Compass,
} from 'lucide-react';
import type { VideoSource } from '../../types/session';
import './TrendingTracksSection.css';

export type TrendingPlatformFilter = 'all' | 'instagram' | 'youtube';

export interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  thumbnailUrl: string;
  duration: number;
  platform: 'instagram' | 'youtube' | 'both';
  reelsCount?: string;
  viewsCount?: string;
  rank: number;
  badge: string;
  tags: string[];
  lyricsSnippet: string;
  genre: string;
}

const TRENDING_TRACKS_DATABASE: TrendingTrack[] = [
  {
    id: 'trending-1',
    title: 'APT.',
    artist: 'ROSÉ & Bruno Mars',
    videoId: 'ekr2nIex040',
    thumbnailUrl: 'https://i.ytimg.com/vi/ekr2nIex040/hqdefault.jpg',
    duration: 173,
    platform: 'both',
    reelsCount: '6.4M Reels',
    viewsCount: '620M Views',
    rank: 1,
    badge: '#1 GLOBAL VIRAL',
    tags: ['Reels Anthem', 'Billboard #1', 'TikTok Viral'],
    lyricsSnippet: "Apateu apateu, apateu apateu... Don't you want me like I want you, baby?",
    genre: 'Pop / Dance',
  },
  {
    id: 'trending-2',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    videoId: 'kPa7bsKwL-c',
    thumbnailUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
    duration: 252,
    platform: 'youtube',
    reelsCount: '3.6M Reels',
    viewsCount: '710M Views',
    rank: 2,
    badge: 'YOUTUBE TOP #1',
    tags: ['Soul Pop', 'Worldwide Hit', 'Grammy Nominee'],
    lyricsSnippet: "If the world was ending, I'd wanna be next to you...",
    genre: 'Pop Ballad',
  },
  {
    id: 'trending-3',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    videoId: 'eVli-tstM5E',
    thumbnailUrl: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
    duration: 175,
    platform: 'instagram',
    reelsCount: '8.2M Reels',
    viewsCount: '560M Views',
    rank: 3,
    badge: 'INSTAGRAM VIRAL #1',
    tags: ['Reels Dance', 'Summer Sensation', 'Grammy Record'],
    lyricsSnippet: "Now he's thinkin' 'bout me every night, oh... Is it that sweet? I guess so!",
    genre: 'Pop / Disco',
  },
  {
    id: 'trending-4',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    videoId: 'V9PVRfjEBTI',
    thumbnailUrl: 'https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg',
    duration: 196,
    platform: 'instagram',
    reelsCount: '6.8M Reels',
    viewsCount: '430M Views',
    rank: 4,
    badge: 'REELS AUDIO TREND',
    tags: ['Emotional Viral', 'Acoustic Soul', 'Hot 100'],
    lyricsSnippet: "I want you to stay, 'til I'm in the grave, 'til I rot away, dead and buried...",
    genre: 'Indie Pop',
  },
  {
    id: 'trending-5',
    title: 'Not Like Us',
    artist: 'Kendrick Lamar',
    videoId: 'T6eK-2OQtew',
    thumbnailUrl: 'https://i.ytimg.com/vi/T6eK-2OQtew/hqdefault.jpg',
    duration: 274,
    platform: 'youtube',
    reelsCount: '4.5M Reels',
    viewsCount: '340M Views',
    rank: 5,
    badge: 'YOUTUBE HIP-HOP #1',
    tags: ['West Coast', 'Record Breaker', 'Global Anthem'],
    lyricsSnippet: "They not like us, they not like us, they not like us...",
    genre: 'Hip-Hop',
  },
  {
    id: 'trending-6',
    title: 'Taste',
    artist: 'Sabrina Carpenter',
    videoId: 'KEG7b851Ric',
    thumbnailUrl: 'https://i.ytimg.com/vi/KEG7b851Ric/hqdefault.jpg',
    duration: 157,
    platform: 'both',
    reelsCount: '3.4M Reels',
    viewsCount: '220M Views',
    rank: 6,
    badge: 'TRENDING VELOCITY',
    tags: ['Music Video Hit', 'Pop Sensation', 'Shorts Viral'],
    lyricsSnippet: "I heard you're back together and if that's true, you'll just have to taste me when he's kissin' you...",
    genre: 'Pop / Rock',
  },
  {
    id: 'trending-7',
    title: 'Million Dollar Baby',
    artist: 'Tommy Richman',
    videoId: 'Zf1d8SGuxfs',
    thumbnailUrl: 'https://i.ytimg.com/vi/Zf1d8SGuxfs/hqdefault.jpg',
    duration: 155,
    platform: 'instagram',
    reelsCount: '5.8M Reels',
    viewsCount: '240M Views',
    rank: 7,
    badge: 'REELS VIRAL SOUND',
    tags: ['Synth Funk', 'Bass Groove', 'Viral Audio'],
    lyricsSnippet: "I ain't never rep a set, baby... I ain't never did no wrong...",
    genre: 'R&B / Funk',
  },
  {
    id: 'trending-8',
    title: 'Gata Only',
    artist: 'FloyyMenor & Cris Mj',
    videoId: 'Cm_ocUG67Wo',
    thumbnailUrl: 'https://i.ytimg.com/vi/Cm_ocUG67Wo/hqdefault.jpg',
    duration: 222,
    platform: 'instagram',
    reelsCount: '9.1M Reels',
    viewsCount: '520M Views',
    rank: 8,
    badge: 'LATIN REELS HIT',
    tags: ['Global Reggaeton', 'Club Viral', 'TikTok #1'],
    lyricsSnippet: "Mami, dime si tú estás pa' mí, como yo estoy puesto pa' ti...",
    genre: 'Reggaeton',
  },
  {
    id: 'trending-9',
    title: 'Timeless',
    artist: 'The Weeknd & Playboi Carti',
    videoId: '5Rmv3nliwCs',
    thumbnailUrl: 'https://i.ytimg.com/vi/5Rmv3nliwCs/hqdefault.jpg',
    duration: 256,
    platform: 'youtube',
    reelsCount: '2.8M Reels',
    viewsCount: '120M Views',
    rank: 9,
    badge: 'YOUTUBE PREMIERE',
    tags: ['Synthwave Trap', 'Billboard Debut', 'Chart Topper'],
    lyricsSnippet: "Ever since I was a jit, I knew I was the shit...",
    genre: 'Synth Trap',
  },
  {
    id: 'trending-10',
    title: 'Good Luck, Babe!',
    artist: 'Chappell Roan',
    videoId: '1RKqOmSkGgM',
    thumbnailUrl: 'https://i.ytimg.com/vi/1RKqOmSkGgM/hqdefault.jpg',
    duration: 218,
    platform: 'both',
    reelsCount: '4.8M Reels',
    viewsCount: '205M Views',
    rank: 10,
    badge: 'VIRAL BREAKTHROUGH',
    tags: ['Reels Chorus', 'Vocal Powerhouse', 'Indie Pop'],
    lyricsSnippet: "You'd have to stop the world just to stop the feeling...",
    genre: 'Synthpop',
  },
  {
    id: 'trending-11',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    videoId: '34Na4j8AVgA',
    thumbnailUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
    duration: 230,
    platform: 'youtube',
    reelsCount: '4.1M Reels',
    viewsCount: '2.5B Views',
    rank: 11,
    badge: 'ALL-TIME YOUTUBE GIANT',
    tags: ['Classic Viral', 'Shorts Trend', 'Electro Pop'],
    lyricsSnippet: "I'm tryna put you in the worst mood, ah... P1 cleaner than your church shoes, ah...",
    genre: 'Electro Pop',
  },
  {
    id: 'trending-12',
    title: 'Greedy',
    artist: 'Tate McRae',
    videoId: 'To4SWGZkEPk',
    thumbnailUrl: 'https://i.ytimg.com/vi/To4SWGZkEPk/hqdefault.jpg',
    duration: 131,
    platform: 'instagram',
    reelsCount: '5.3M Reels',
    viewsCount: '290M Views',
    rank: 12,
    badge: 'REELS CHOREO VIRAL',
    tags: ['Dance Trend', 'Viral Chorus', 'Billboard Hot 100'],
    lyricsSnippet: "I would want myself... Baby, please believe me, I'll put you through hell...",
    genre: 'Dance Pop',
  },
];

interface TrendingTracksSectionProps {
  onStartSession: (source: VideoSource) => void;
  onOpenArtist?: (artistName: string) => void;
}

export const TrendingTracksSection: React.FC<TrendingTracksSectionProps> = React.memo<TrendingTracksSectionProps>(({
  onStartSession,
  onOpenArtist,
}) => {
  const [platformFilter, setPlatformFilter] = useState<TrendingPlatformFilter>('all');
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  const filteredTracks = useMemo(() => {
    if (platformFilter === 'all') return TRENDING_TRACKS_DATABASE;
    if (platformFilter === 'instagram') {
      return TRENDING_TRACKS_DATABASE.filter(t => t.platform === 'instagram' || t.platform === 'both');
    }
    return TRENDING_TRACKS_DATABASE.filter(t => t.platform === 'youtube' || t.platform === 'both');
  }, [platformFilter]);

  const spotlightTrack = filteredTracks[0] || TRENDING_TRACKS_DATABASE[0];
  const listTracks = filteredTracks.slice(1);

  const handlePlayTrack = (track: TrendingTrack) => {
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
    <section className="trending-section" aria-label="Current Trending Instagram and YouTube Songs">
      <div className="trending-container">
        {/* Section Header */}
        <div className="trending-header">
          <div className="trending-title-group">
            <div className="trending-label-row">
              <Flame size={14} className="trending-fire-icon" />
              <span>VIRAL SOUND ENGINE</span>
              <span className="trending-live-dot" />
              <span className="trending-live-text">REAL-TIME CHARTS</span>
            </div>
            <h2 className="trending-heading">Trending on Instagram & YouTube</h2>
            <p className="trending-subheading">
              Current viral sounds, Reels choreography anthems, and YouTube trending sensations.
              Select any track to ignite 24-bit real-time synchronized lyrics.
            </p>
          </div>

          {/* Platform Category Tabs */}
          <div className="trending-filter-tabs" role="tablist" aria-label="Platform Filters">
            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'all'}
              className={`trending-tab ${platformFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('all')}
            >
              <Sparkles size={13} />
              <span>All Viral ({TRENDING_TRACKS_DATABASE.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'instagram'}
              className={`trending-tab tab-instagram ${platformFilter === 'instagram' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('instagram')}
            >
              <div className="instagram-gradient-dot" />
              <span>Instagram Reels</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={platformFilter === 'youtube'}
              className={`trending-tab tab-youtube ${platformFilter === 'youtube' ? 'active' : ''}`}
              onClick={() => setPlatformFilter('youtube')}
            >
              <Video size={13} className="youtube-tab-icon" />
              <span>YouTube Hits</span>
            </button>
          </div>
        </div>

        {/* Cinematic Spotlight Banner for #1 Filtered Track */}
        {spotlightTrack && (
          <motion.div
            key={spotlightTrack.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="trending-spotlight-card"
          >
            <div className="spotlight-media-pane">
              <img
                src={spotlightTrack.thumbnailUrl}
                alt={`${spotlightTrack.title} by ${spotlightTrack.artist}`}
                className="spotlight-thumb-image"
                loading="lazy"
              />
              <div className="spotlight-media-scrim" />

              <div className="spotlight-rank-badge">
                <span className="rank-hash">#</span>
                <span className="rank-num">0{spotlightTrack.rank}</span>
                <span className="rank-label">TOP VIRAL</span>
              </div>

              <div className="spotlight-sound-indicator">
                <span className="sound-wave-bar bar-1" />
                <span className="sound-wave-bar bar-2" />
                <span className="sound-wave-bar bar-3" />
                <span className="sound-wave-bar bar-4" />
              </div>
            </div>

            <div className="spotlight-content-pane">
              <div className="spotlight-meta-top">
                <span className="spotlight-viral-pill">
                  <Flame size={12} className="pill-flame-icon" />
                  {spotlightTrack.badge}
                </span>

                <div className="spotlight-platform-tags">
                  {(spotlightTrack.platform === 'instagram' || spotlightTrack.platform === 'both') && (
                    <span className="platform-tag instagram">
                      <span className="tag-ig-gradient" />
                      {spotlightTrack.reelsCount || 'Reels Viral'}
                    </span>
                  )}
                  {(spotlightTrack.platform === 'youtube' || spotlightTrack.platform === 'both') && (
                    <span className="platform-tag youtube">
                      <Video size={11} />
                      {spotlightTrack.viewsCount || 'YouTube Trending'}
                    </span>
                  )}
                </div>
              </div>

              <h3 className="spotlight-track-title">{spotlightTrack.title}</h3>

              <div className="spotlight-artist-row">
                <span className="spotlight-artist-name">{spotlightTrack.artist}</span>
                {onOpenArtist && (
                  <button
                    type="button"
                    className="spotlight-artist-link"
                    onClick={() => onOpenArtist(spotlightTrack.artist.split('&')[0].split('ft.')[0].trim())}
                    title={`View ${spotlightTrack.artist} discography`}
                  >
                    <Compass size={11} />
                    <span>View Artist</span>
                  </button>
                )}
              </div>

              <p className="spotlight-lyrics-quote">
                "{spotlightTrack.lyricsSnippet}"
              </p>

              <div className="spotlight-tags-list">
                {spotlightTrack.tags.map((tag) => (
                  <span key={tag} className="spotlight-tag-item">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="spotlight-actions-bar">
                <button
                  type="button"
                  className="spotlight-play-btn"
                  onClick={() => handlePlayTrack(spotlightTrack)}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Audition in LyriXer</span>
                </button>

                <div className="spotlight-engine-stat">
                  <Activity size={13} className="engine-stat-icon" />
                  <span>24-bit Spatial Sync Ready</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Viral Tracks Grid */}
        <div className="trending-grid" role="list">
          <AnimatePresence mode="popLayout">
            {listTracks.map((track, index) => {
              const isHovered = hoveredTrackId === track.id;

              return (
                <motion.article
                  key={track.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.04 }}
                  className="trending-card"
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                >
                  {/* Card Thumbnail Stage */}
                  <div className="card-media-stage">
                    <img
                      src={track.thumbnailUrl}
                      alt={`${track.title} by ${track.artist}`}
                      className="card-thumb"
                      loading="lazy"
                    />
                    <div className="card-thumb-scrim" />

                    {/* Rank Badge */}
                    <div className="card-rank-tag">
                      <span>#{track.rank < 10 ? `0${track.rank}` : track.rank}</span>
                    </div>

                    {/* Live Equalizer bars on hover */}
                    <div className={`card-eq-bars ${isHovered ? 'active' : ''}`} aria-hidden="true">
                      <span className="eq-line line-1" />
                      <span className="eq-line line-2" />
                      <span className="eq-line line-3" />
                      <span className="eq-line line-4" />
                    </div>

                    {/* Quick Play Trigger Button */}
                    <button
                      type="button"
                      className="card-play-trigger"
                      onClick={() => handlePlayTrack(track)}
                      title={`Play ${track.title} with synced lyrics`}
                      aria-label={`Play ${track.title} with synced lyrics`}
                    >
                      <Play size={18} fill="currentColor" />
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="card-details">
                    <div className="card-meta-row">
                      <span className="card-badge-pill">{track.badge}</span>
                      
                      <div className="card-platform-pills">
                        {(track.platform === 'instagram' || track.platform === 'both') && (
                          <span className="platform-mini-pill ig" title="Instagram Reels Viral">
                            <span className="ig-dot" />
                            <span>{track.reelsCount || 'Reels'}</span>
                          </span>
                        )}
                        {(track.platform === 'youtube' || track.platform === 'both') && (
                          <span className="platform-mini-pill yt" title="YouTube Trending">
                            <Video size={10} />
                            <span>{track.viewsCount || 'YouTube'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="card-title" title={track.title}>{track.title}</h4>
                    
                    <div className="card-artist-line">
                      <span className="card-artist" title={track.artist}>{track.artist}</span>
                    </div>

                    <p className="card-lyric-snippet">"{track.lyricsSnippet}"</p>

                    <div className="card-footer-row">
                      <span className="card-genre">{track.genre}</span>
                      
                      <button
                        type="button"
                        className="card-audition-btn"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Play Synced</span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
});

TrendingTracksSection.displayName = 'TrendingTracksSection';
